/* ============================================================================
 *  ШАБЛОН: как добавить запрос к бэкенду и вывести данные на странице.
 *  Скопируй этот файл, переименуй и поправь под свой эндпоинт.
 *  Это рабочий пример на реальном публичном эндпоинте /api/proficiencies/.
 * ========================================================================== */

import { useEffect, useState } from 'react'
import { fetchAll } from './client'
// Для вариантов Б–Г ниже добавь в импорт `request`:
//   import { request, fetchAll } from './client'

/* ----------------------------------------------------------------------------
 *  ШАГ 1. Опиши ТИП ответа (обычно живёт в types.ts).
 *  Смотри форму ответа в http://api.kigo.uz/api/docs/ (блок Schema).
 * -------------------------------------------------------------------------- */
interface ApiExample {
  id: number
  code: string
  name_uz: string | null
  name_ru: string | null
  name_en: string | null
}

/* ----------------------------------------------------------------------------
 *  ШАГ 2. Напиши ФУНКЦИЮ-ЗАПРОС (обычно живёт в endpoints.ts).
 *
 *  Вариант А — список со страницами ({count,next,results}) → fetchAll:
 * -------------------------------------------------------------------------- */
const getExamples = () => fetchAll<ApiExample>('/api/proficiencies/')

/*  Вариант Б — обычный ответ (объект или массив без пагинации) → request:
 *
 *    const getOne   = (id: number) => request<ApiExample>(`/api/proficiencies/${id}/`)
 *
 *  Вариант В — с query-параметрами (?q=&status=):
 *
 *    const search   = (q: string) =>
 *      request<ApiExample[]>('/api/admin/players/', { query: { q } })
 *
 *  Вариант Г — создать/изменить (POST/PATCH/DELETE), токен подставится сам:
 *
 *    const create   = (body: Partial<ApiExample>) =>
 *      request<ApiExample>('/api/admin/sports/', { method: 'POST', body })
 *    const patch    = (id: number, body: Partial<ApiExample>) =>
 *      request<ApiExample>(`/api/admin/sports/${id}/`, { method: 'PATCH', body })
 *    const remove   = (id: number) =>
 *      request<void>(`/api/games/${id}/`, { method: 'DELETE' })
 */

/* ----------------------------------------------------------------------------
 *  ШАГ 3 (по желанию). АДАПТЕР — привести ответ к форме для UI (adapters.ts).
 * -------------------------------------------------------------------------- */
interface Row { id: number; title: string }
const adapt = (x: ApiExample): Row => ({
  id: x.id,
  title: x.name_uz || x.name_ru || x.name_en || x.code, // fallback по языкам
})

/* ----------------------------------------------------------------------------
 *  ШАГ 4. ВЫЗОВ на странице: useEffect + три состояния (loading/error/data).
 *  Скопируй этот блок в свой компонент в src/pages/.
 * -------------------------------------------------------------------------- */
export default function ExamplePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true // защита от setState после размонтирования
    ;(async () => {
      try {
        const data = await getExamples()      // ← дёргаем запрос
        if (alive) { setRows(data.map(adapt)); setError(null) }
      } catch (e) {
        // request() кидает ApiError с человекочитаемым .message
        if (alive) setError(e instanceof Error ? e.message : 'Xatolik')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, []) // [] = один раз при открытии. Зависимости (напр. [q]) → перезапрос

  if (loading) return <div>Yuklanmoqda…</div>
  if (error) return <div style={{ color: '#ff5c6a' }}>Xatolik: {error}</div>

  return (
    <ul>
      {rows.map((r) => <li key={r.id}>{r.title}</li>)}
    </ul>
  )
}
