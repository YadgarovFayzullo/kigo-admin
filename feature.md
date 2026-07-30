# KiGo Admin — пробелы в бэкенде (для backend-разработчика)

Документ описывает, чего не хватает в API `https://api.kigo.uz` для админ-панели.
Проверено по OpenAPI-схеме `https://api.kigo.uz/api/schema/`.
Каждый пункт: **что просят в панели → что есть сейчас → что нужно добавить**.

Легенда приоритета: 🔴 блокирует фичу · 🟡 важно · 🟢 улучшение.

---

## 1. 🔴 Организации (Tashkilotlar) — раздел целиком отсутствует

**Нужно в панели:** отдельная страница организаций + добавление/редактирование.

**Сейчас:** эндпоинта `/api/admin/organizations/` (или `/companies/`) **нет вообще**.

**Нужно добавить** (по образцу `/api/admin/clubs/`):

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/admin/organizations/` | список (с пагинацией `count/next/results`) |
| POST | `/api/admin/organizations/` | создание |
| GET | `/api/admin/organizations/{id}/` | детально |
| PATCH | `/api/admin/organizations/{id}/` | редактирование |
| GET | `/api/admin/organizations/{id}/clubs/` | клубы организации (опц.) |

Предлагаемые поля `Organization`: `id`, `name`, `inn/tax_id`, `region`/`district` (ref),
`address`, `admins[]` (см. п.3), `status` (ref), `created_at`.
Нужно решить связь **Club ↔ Organization**: добавить у клуба `organization_id`.

---

## 2. 🔴 Блокировка клуба с причиной

**Нужно в панели:** заблокировать клуб, указав причину (sabab).

**Сейчас:** блокировка есть **только у игроков**:
- `POST /api/admin/players/{id}/block/`
- `POST /api/admin/players/{id}/unblock/`

У клубов — только статус `active/pending/paused` (ClubStatus), без действия block и без причины.

**Нужно добавить** (по образцу игроков, но с телом-причиной):

```
POST /api/admin/clubs/{id}/block/     body: { "reason": "string" }  -> Club
POST /api/admin/clubs/{id}/unblock/                                 -> Club
```

И в схему `Club` добавить поля: `blocked` (bool) или отдельный статус `blocked`,
`block_reason` (string, nullable), `blocked_at` (datetime, nullable).

---

## 3. 🔴 Несколько админов у клуба (сейчас только один)

**Нужно в панели:** добавлять больше одного администратора клуба (кнопка «+»).

**Сейчас** у `Club` / `ClubWrite` — ровно **один** админ, плоскими полями:
`admin_name`, `admin_phone`, `admin_email`.

**Нужно добавить:** массив админов вместо трёх полей.

```jsonc
// Club (response)
"admins": [
  {
    "id": 1,
    "name": "string",
    "phone": "string",
    "email": "string",
    "telegram_username": "string|null"   // см. п.4
  }
]
```

```jsonc
// ClubWrite (request) — приём массива на create/update
"admins": [
  { "name": "...", "phone": "...", "email": "...", "telegram_username": "..." }
]
```

Обратная совместимость: старые `admin_name/phone/email` можно оставить как «первый админ»
на переходный период, но панель ориентируется на массив `admins[]`.

---

## 4. 🔴 Telegram у админа клуба

**Нужно в панели:** поле Telegram (username/id) в карточке админа клуба.

**Сейчас:** у админа клуба поля Telegram нет. (Telegram есть только у обычного
пользователя приложения — `/api/auth/telegram/`, схема `TelegramConnect`.)

**Нужно добавить:** поле `telegram_username` (и/или `telegram_id`) в объект админа клуба
(см. массив `admins[]` в п.3).

---

## 5. 🔴 Статус оплаты клуба (to'lagan / to'lamagan)

**Нужно в панели:** фильтр и отметка «оплатил / не оплатил» для клубов.

**Сейчас:** у клуба **нет** поля оплаты/подписки/тарифа.

**Нужно добавить** в `Club`:
- `is_paid` (bool) — минимально, либо
- `payment_status` (ref: `paid` / `unpaid` / `overdue`) + `paid_until` (date, nullable) —
  если нужна дата действия оплаты.

И фильтр на список: `GET /api/admin/clubs/?payment_status=unpaid` (или `?is_paid=false`).

---

## 6. 🔴 Stats-эндпоинты не типизированы — не знаем имён полей

**Где:** дашборд, блоки «Foydalanuvchilar oqimi», «Soʻrovlar», «Sherik / raqib qidiruvi».

**Сейчас** в схеме эти ответы описаны как безтиповый `object`:
- `GET /api/admin/stats/overview/`
- `GET /api/admin/stats/summary/`
- `GET /api/admin/stats/by-region/`
- `GET /api/admin/stats/by-sport/`
- `GET /api/admin/stats/matches-per-month/`

Из-за этого фронт перебирает возможные имена полей и показывает `—`, когда не угадал.

**Нужно:** задокументировать точные поля (drf-spectacular `@extend_schema`/serializer).
Панель ожидает такие метрики (имена можно свои — просто зафиксируйте их в схеме):

```jsonc
// overview / summary
{
  "registered_today": 0,
  "installs_7d": 0,
  "installs_30d": 0,
  "males": 0,
  "females": 0,
  "active_requests_now": 0,
  "requests_sent": 0,
  "requests_accepted": 0,
  "requests_rejected": 0,
  "men_partner": 0, "men_opponent": 0,
  "women_partner": 0, "women_opponent": 0,
  "mixed_partner_opponent": 0
}
```

```jsonc
// matches-per-month
[ { "month": "2026-01", "value": 210 }, ... ]
```

---

## 7. 🟡 `next` в пагинации приходит как `http://` → ломает CORS

**Проблема:** списки отдают `next: "http://api.kigo.uz/api/...?page=2"`.
`http` → 301-редирект на `https`, а редирект запрещён для CORS-preflight
(`Redirect is not allowed for a preflight request`) — вторая и следующие страницы не грузятся.

**Причина:** DRF строит абсолютный URL без учёта `X-Forwarded-Proto` за прокси.

**Нужно:** отдавать `next`/`previous` по **https** (настроить
`SECURE_PROXY_SSL_HEADER` / `USE_X_FORWARDED_HOST`, либо `?page=` без схемы).
Сейчас фронт вынужден переписывать `http`→`https` вручную — это костыль.

---

## 8. 🟡 Ответ логина не описан в схеме

**Где:** `POST /api/admin/auth/login/`.

**Сейчас:** ответ `200` описан только как «Logged in», **без тела**.
Фронт вслепую ищет токен по ключам `token/access/key/access_token` (и вложенным).

**Нужно:** задокументировать тело ответа и точное имя поля токена, напр.:
```jsonc
{ "access": "jwt...", "refresh": "jwt..." }
```
Плюс подтвердить схему авторизации (сейчас `jwtAuth` → `Authorization: Bearer <token>`).

---

## 9. 🟢 У жалобы (Report) нет района (tuman)

**Где:** страница Shikoyatlar — хотели фильтр по туману, но не смогли.

**Сейчас:** в `Report` есть только `region` (нет `district`).

**Нужно (по желанию):** добавить `district` (ref) в `Report`, тогда добавим фильтр по туману
как на остальных страницах.

---

## 10. 🔴 Админские списки отдают `{"items": […]}` — не то, что в схеме

**Где:** `/api/admin/players/`, `/api/admin/matches/`, `/api/admin/clubs/`, `/api/admin/reports/`.

**Сейчас:** три разных формата списков в одном API:

| Эндпоинты | Формат ответа |
|---|---|
| публичные `/api/regions/`, `/api/sports/`, `/api/districts/` | `{count, next, previous, results}` |
| админские списки | `{"items": [ … ]}` — **без `count`, без `next`** |
| схема OpenAPI для обоих | `type: array` (не соответствует ни одному) |

Из-за этого фронт читал `results` и получал пустые таблицы и нули в бейджах меню.

**Нужно:** привести админские списки к тому же DRF-конверту `{count, next, previous, results}`,
что и публичные (или хотя бы добавить в `items`-конверт `count` и `next`), и описать
конверт в схеме вместо `type: array`. Сейчас фронт вынужден распознавать
`results|items|data|rows` и, при отсутствии `next`, перебирать `?page=N` вслепую.

---

## 11. 🟡 У списков нет сортировки, у `Sport` — признака командный/одиночный

**Где:** `GET /api/admin/players/` (для блока «последние зарегистрированные» на дашборде)
и `POST /api/admin/sports/`.

**Сейчас:**
- у `/api/admin/players/` параметры только `gender`, `q`, `region`, `sport`, `status` —
  ни `ordering`, ни фильтра по дате. Чтобы показать последних юзеров, фронт грузит
  **весь** список и сортирует по `created_at` на клиенте;
- у `Sport`/`AdminSportWrite` нет поля вида «командный / одиночный», хотя в панели
  это показывается (`Jamoaviy` / `Yakkama-yakka`) — сейчас захардкожено в маппинге по `code`,
  и для нового вида спорта всегда получается «Yakkama-yakka».

**Нужно:**
```
GET /api/admin/players/?ordering=-created_at   (и вообще ?ordering= у списков)
Sport / AdminSportWrite: + "kind": "team" | "solo"   (или "is_team": bool)
```

---

## 12. 🔴 `GET /api/sports/{id}/` отдаёт 500, а список — только активные

**Проверено 30.07.2026:**
```
GET /api/sports/?page_size=100   -> {"count":1, results:[padel (id 6)]}
GET /api/sports/1..5/            -> 500 Internal Server Error
GET /api/sports/6/               -> 200
```
Пять исходных видов спорта (football, basketball, tennis, …) пропали из публичного
справочника, а их detail-эндпоинты падают с 500 (ожидался бы 404, если они скрыты).
Похоже, это следствие `PATCH /api/admin/sports/{id}/ {"active": false}`.

**Нужно:**
1. Разобраться, почему detail отдаёт 500 вместо 404/200 — и не портит ли
   `PATCH {active}` строку (например, не пишет ли `is_active = NULL`).
2. Определиться, должен ли публичный `/api/sports/` фильтровать по `is_active`.
   Если да — админке нужен полный список (она берёт `/api/admin/sports/`, там
   есть `is_active`), а деактивация не должна ломать detail.

---

## 13. 🟡 Просроченный `Bearer`-токен: запрос висит вместо 401

**Проверено:**
```
curl -H "Authorization: Bearer nonsense" /api/sports/   -> нет ответа (таймаут)
curl -H "Authorization: Token nonsense"  /api/sports/   -> 200
curl без заголовка                        /api/sports/  -> 200
```
С невалидным JWT сервер не отвечает вообще. На фронте это выглядело как «справочники
не грузятся»: промис висел вечно, и селекты (спорт / вилоят / туман) молча оставались
пустыми — без ошибки. Сейчас на клиенте стоит таймаут 20 с, но это костыль.

**Нужно:** отдавать `401` на невалидный/просроченный токен, как на других путях.

---

## Что уже работает (доработок не требует)

- Игроки: список + фильтры + `block`/`unblock`.
- Спорт: `POST /api/admin/sports/` (создание по `code` + `name_uz/ru/en` + `is_active`)
  и `PATCH /api/admin/sports/{id}/` с телом `{active: bool}`.
- Матчи, клубы, жалобы, регионы, спорт — список/детально.
- Справочники: `sports`, `regions`, `districts` (есть `region_id`), статусы, категории.
- Пагинация с `page_size` (потолок 100).

> ⚠️ Мелочь по локализации: `/api/admin/regions/` отдаёт `name` только по-русски.
> Панель подтягивает узбекское имя из `/api/regions/` по `id`. Если удобно —
> добавьте в `AdminRegion` `name_uz/name_ru/name_en` как в остальных справочниках.
