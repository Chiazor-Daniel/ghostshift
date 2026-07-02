import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  startOfMonth,
  startOfWeek,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  addWeeks,
  addDays,
  isSameDay,
  isSameMonth,
  format,
  startOfDay,
} from 'date-fns'
import { Tabs } from './ui.jsx'

/**
 * Calendar — a real Google-style month/week/day calendar built on date-fns.
 * No new dependencies (date-fns is already installed).
 *
 * Events are shift objects with: { id, date ('YYYY-MM-DD'), startHour, durationHours,
 * title, status, department, role }. Clicking an event fires onSelectEvent;
 * clicking an empty day cell fires onSelectDay.
 */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOUR_START = 6 // first visible hour row
const HOUR_END = 23 // last visible hour row (inclusive)
const HOUR_PX = 44 // row height in px for week/day time grid

// Status → chip style. Open shifts read as "claimable" (primary dashed).
const statusStyles = {
  active: 'bg-primary text-on-primary border border-primary',
  confirmed: 'bg-primary/15 text-primary border border-primary/30',
  scheduled: 'bg-primary/15 text-primary border border-primary/30',
  open: 'border-2 border-dashed border-primary/50 bg-primary/5 text-primary',
  pending: 'bg-warning/15 text-warning border border-warning/40',
  completed: 'bg-surface-variant text-on-surface-variant border border-outline-variant/40',
}

const styleFor = (s) => statusStyles[s] || statusStyles.confirmed

function eventsForDay(day, events) {
  const key = day.toDateString()
  return events.filter((e) => {
    const [y, m, d] = e.date.split('-').map(Number)
    return new Date(y, m - 1, d).toDateString() === key
  })
}

export default function Calendar({
  events = [],
  onSelectEvent,
  onSelectDay,
  initialView = 'month',
  today = new Date('2026-06-27'),
  headerExtra,
}) {
  const [cursor, setCursor] = useState(today) // the focused date / month
  const [view, setView] = useState(initialView)

  const label = useMemo(() => {
    if (view === 'month') return format(cursor, 'MMMM yyyy')
    if (view === 'week') {
      const start = startOfWeek(cursor, { weekStartsOn: 1 })
      const end = endOfWeek(cursor, { weekStartsOn: 1 })
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    }
    return format(cursor, 'EEE, MMM d, yyyy')
  }, [cursor, view])

  const goPrev = () => {
    if (view === 'month') setCursor((c) => addMonths(c, -1))
    else if (view === 'week') setCursor((c) => addWeeks(c, -1))
    else setCursor((c) => addDays(c, -1))
  }
  const goNext = () => {
    if (view === 'month') setCursor((c) => addMonths(c, 1))
    else if (view === 'week') setCursor((c) => addWeeks(c, 1))
    else setCursor((c) => addDays(c, 1))
  }
  const goToday = () => setCursor(today)

  return (
    <div className="flex flex-col h-full">
      {/* Header — month label + nav + view switcher */}
      <div className="flex items-center justify-between gap-md px-md py-sm border-b border-outline-variant/30 flex-wrap">
        <div className="flex items-center gap-sm min-w-0">
          <h2 className="font-headline-md text-headline-md text-on-surface truncate">
            {label}
          </h2>
          <button onClick={goPrev} aria-label="Previous" className="btn-icon-sm">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button onClick={goNext} aria-label="Next" className="btn-icon-sm">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
          <button onClick={goToday} className="btn-secondary py-xs px-sm text-xs">
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          <Tabs
            tabs={[
              { id: 'month', label: 'Month' },
              { id: 'week', label: 'Week' },
              { id: 'day', label: 'Day' },
            ]}
            activeTab={view}
            onChange={setView}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {view === 'month' && (
          <MonthView cursor={cursor} today={today} events={events} onSelectEvent={onSelectEvent} onSelectDay={onSelectDay} />
        )}
        {view === 'week' && (
          <WeekView cursor={cursor} today={today} events={events} onSelectEvent={onSelectEvent} />
        )}
        {view === 'day' && (
          <DayView cursor={cursor} today={today} events={events} onSelectEvent={onSelectEvent} />
        )}
      </div>
    </div>
  )
}

/* ----------------------------- Month view ----------------------------- */
function MonthView({ cursor, today, events, onSelectEvent, onSelectDay }) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  return (
    <div className="flex flex-col h-full">
      {/* Header + day grid share one horizontal scroll so the weekday columns
         stay aligned with the day cells on narrow screens. */}
      <div className="overflow-x-auto flex-1 scrollbar-thin -mx-4 md:mx-0">
        <div className="min-w-[580px] md:min-w-0 px-4 md:px-0">
          <div className="grid grid-cols-7 border-b border-outline-variant/30">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-1 py-sm text-center font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant border-r border-outline-variant/20 last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const inMonth = isSameMonth(day, cursor)
              const isToday = isSameDay(day, today)
              const dayEvents = eventsForDay(day, events)
              const borderClasses = 'border-r border-b border-outline-variant/20'

              return (
                <div
                  key={i}
                  className={`${borderClasses} ${inMonth ? 'bg-surface/40' : 'bg-surface-variant/20'} ${
                    isToday ? 'bg-primary/[0.04]' : ''
                  } min-h-[100px] md:min-h-[112px] p-1 flex flex-col gap-0.5 group hover:bg-primary/[0.03] transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onSelectDay?.(day)}
                      className={`flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full font-label-sm md:font-label-md transition-colors ${
                        isToday
                          ? 'bg-primary text-on-primary font-bold'
                          : inMonth
                            ? 'text-on-surface hover:bg-primary/10'
                            : 'text-on-surface-variant/50 hover:bg-surface-variant'
                      }`}
                      aria-label={format(day, 'EEEE, MMMM d')}
                    >
                      {format(day, 'd')}
                    </button>
                    {dayEvents.length > 3 && (
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 min-w-0">
                    {dayEvents.slice(0, 2).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => onSelectEvent?.(e)}
                        className={`text-left px-1 py-0.5 rounded font-label-sm text-[10px] md:text-label-sm truncate transition-all hover:scale-[1.02] ${styleFor(e.status)}`}
                        title={`${e.title} · ${e.department}`}
                      >
                        <span className="truncate">{e.title}</span>
                      </button>
                    ))}
                    {dayEvents.length === 0 && inMonth && (
                      <span
                        onClick={() => onSelectDay?.(day)}
                        className="text-on-surface-variant/30 text-label-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer select-none"
                      >
                        +
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {events.length === 0 && (
        <div className="px-4 pb-4 text-center font-body-sm text-sm text-on-surface-variant/60">
          No shifts scheduled
        </div>
      )}
    </div>
  )
}

/* ----------------------------- Week view ------------------------------ */
function TimeGrid({ days, today, events, onSelectEvent }) {
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <div style={{ minWidth: days.length === 1 ? '400px' : '580px' }}>
          <div className="grid border-b border-outline-variant/30" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0,1fr))` }}>
            <div />
            {days.map((day) => {
              const isToday = isSameDay(day, today)
              return (
                <div key={day.toISOString()} className="px-1 py-sm text-center border-l border-outline-variant/20">
                  <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={`mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full font-label-md text-label-md ${
                      isToday ? 'bg-primary text-on-primary font-bold' : 'text-on-surface'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="overflow-y-auto scrollbar-thin" style={{ height: 'calc(100% - 52px)' }}>
            <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0,1fr))` }}>
              <div className="relative" style={{ height: hours.length * HOUR_PX }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute right-1 font-label-sm text-label-sm text-on-surface-variant/70 -translate-y-1/2"
                    style={{ top: (h - HOUR_START) * HOUR_PX }}
                  >
                    {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                  </div>
                ))}
              </div>

              {days.map((day) => {
                const isToday = isSameDay(day, today)
                const dayEvents = eventsForDay(day, events)
                return (
                  <div
                    key={day.toISOString()}
                    className={`relative border-l border-outline-variant/20 ${isToday ? 'bg-primary/[0.03]' : ''}`}
                    style={{ height: hours.length * HOUR_PX }}
                  >
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-outline-variant/15"
                        style={{ top: (h - HOUR_START) * HOUR_PX }}
                      />
                    ))}
                    {dayEvents.map((e) => {
                      const top = Math.max(0, (e.startHour - HOUR_START) * HOUR_PX)
                      const height = Math.max(22, e.durationHours * HOUR_PX - 4)
                      return (
                        <button
                          key={e.id}
                          onClick={() => onSelectEvent?.(e)}
                          className={`absolute left-1 right-1 rounded-md px-1 py-0.5 text-left overflow-hidden transition-all hover:scale-[1.02] hover:z-10 ${styleFor(e.status)}`}
                          style={{ top, height }}
                          title={`${e.title} · ${e.department}`}
                        >
                          <div className="font-label-sm text-label-sm font-semibold truncate">{e.title}</div>
                          <div className="font-label-sm text-label-sm opacity-80 truncate">
                            {formatTime(e.startHour)} · {e.durationHours}h
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WeekView({ cursor, today, events, onSelectEvent }) {
  const start = startOfWeek(cursor, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  return <TimeGrid days={days} today={today} events={events} onSelectEvent={onSelectEvent} />
}

function DayView({ cursor, today, events, onSelectEvent }) {
  const days = [startOfDay(cursor)]
  return <TimeGrid days={days} today={today} events={events} onSelectEvent={onSelectEvent} />
}

/* ----------------------------- helpers -------------------------------- */
function formatTime(h) {
  if (h === 12) return '12 PM'
  if (h === 24 || h === 0) return '12 AM'
  return h > 12 ? `${h - 12} PM` : `${h} AM`
}