# Implementation Plan: Todo Life Dashboard

## Overview

Build a three-file client-side productivity dashboard (index.html, css/style.css, js/script.js) using plain HTML, CSS, and vanilla JavaScript. Widgets are initialized sequentially on DOMContentLoaded; all state persists in localStorage.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` with semantic elements: `<header>`, `<main>`, `<section>` containers for each widget
  - Create `css/style.css` and `js/script.js` as empty files linked from `index.html`
  - Add `aria-label` attributes to all icon-only button placeholders
  - _Requirements: 1.1, 1.2, 9.4_

- [x] 2. Implement CSS design system and layout
  - [x] 2.1 Define CSS custom properties for light and dark themes on `:root` and `[data-theme="dark"]`
    - Light: `--color-primary: #7FB77E`, `--color-accent: #F7C8A0`, `--color-bg: #FFF9F5`, `--color-surface: #FFFFFF`, `--text-primary: #2F2F2F`, `--text-secondary: #6B6B6B`
    - Dark: `--color-primary: #5C8D89`, `--color-accent: #E8A87C`, `--color-bg: #1E1E1E`, `--color-surface: #2A2A2A`, `--text-primary: #F5F5F5`, `--text-secondary: #B0B0B0`
    - _Requirements: 7.3, 7.4_
  - [x] 2.2 Implement layout and design tokens
    - Max content width `1200px`, centered; CSS Grid `repeat(auto-fill, minmax(280px, 1fr))`
    - Card `border-radius: 16px`, button/input `border-radius: 10px`, 8px spacing grid
    - `box-shadow: 0 10px 25px rgba(0,0,0,0.1)` on cards; `0.2s–0.3s ease` transitions
    - Hover lift (`translateY(-2px)`) on buttons and cards; accent color on input focus
    - Visible focus states on all interactive elements
    - _Requirements: 8.1–8.9, 9.3_
  - [x] 2.3 Add descriptive section comments to `css/style.css`
    - _Requirements: 9.5_

- [x] 3. Implement Clock widget
  - [x] 3.1 Implement `formatTime(date)` and `formatDate(date)` pure functions in `js/script.js`
    - `formatTime` returns `HH:MM:SS` with zero-padded values
    - `formatDate` returns full date string (e.g., "Monday, 14 July 2025")
    - _Requirements: 2.1, 2.2_
  - [ ]* 3.2 Write property test for clock time format
    - **Property 1: Clock time format** — `fc.date()` → result matches `/^\d{2}:\d{2}:\d{2}$/`
    - **Validates: Requirements 2.1**
  - [ ]* 3.3 Write property test for clock date format
    - **Property 2: Clock date format** — `fc.date()` → result contains weekday, numeric day, month name, four-digit year
    - **Validates: Requirements 2.2**
  - [x] 3.4 Implement `initClock()` — wire `setInterval` at 1000ms to update `#clock` and `#date` DOM elements on page load
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Implement Greeting widget
  - [x] 4.1 Implement `getGreeting(hour)`, `buildGreetingText(hour, name)`, `loadName()`, `saveName(name)` functions
    - Morning: 5–11, Afternoon: 12–15, Evening: 16–18, Night: 19–23 and 0–4
    - `loadName` / `saveName` use `localStorage` key `dashboard_name`; wrap in try/catch
    - _Requirements: 3.1–3.8_
  - [ ]* 4.2 Write property test for greeting phrase correctness
    - **Property 3: Greeting phrase correctness** — `fc.integer({ min: 0, max: 23 })` → correct phrase for each range
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  - [ ]* 4.3 Write property test for greeting text composition
    - **Property 4: Greeting text composition** — `fc.tuple(fc.integer({ min: 0, max: 23 }), fc.string({ minLength: 1 }))` → result contains phrase and name
    - **Validates: Requirements 3.5**
  - [ ]* 4.4 Write property test for name persistence round-trip
    - **Property 5: Name persistence round-trip** — `fc.string({ minLength: 1 })` → `saveName` then `loadName` returns same value (mocked localStorage)
    - **Validates: Requirements 3.6, 3.7**
  - [x] 4.5 Implement `initGreeting()` — wire `#greeting` display and `#name-input` event listener
    - _Requirements: 3.5–3.8_

- [x] 5. Implement Pomodoro Timer
  - [x] 5.1 Implement `formatTime(seconds)`, `startTimer()`, `pauseTimer()`, `resetTimer()`, and `tick()` functions
    - `startTimer` guards against stacking intervals; `tick` guards against going below zero
    - `resetTimer` sets `secondsLeft = 1500` and display to "25:00"
    - _Requirements: 4.1–4.7_
  - [ ]* 5.2 Write property test for timer reset invariant
    - **Property 6: Timer reset invariant** — for any `secondsLeft` value, `resetTimer()` always yields `secondsLeft === 1500` and display "25:00"
    - **Validates: Requirements 4.5**
  - [ ]* 5.3 Write property test for timer non-negative invariant
    - **Property 7: Timer non-negative invariant** — any sequence of `tick()` calls never produces `secondsLeft < 0`
    - **Validates: Requirements 4.6**
  - [ ]* 5.4 Write property test for single interval invariant
    - **Property 8: Single interval invariant** — any number of consecutive `startTimer()` calls results in at most one active interval handle
    - **Validates: Requirements 4.7**
  - [x] 5.5 Implement `initPomodoro()` — wire `#btn-start`, `#btn-pause`, `#btn-reset` and `#timer-display`; disable start button while running
    - _Requirements: 4.1–4.7_

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Todo List
  - [x] 7.1 Implement `loadTasks()`, `saveTasks(tasks)`, `addTask(text)`, `toggleTask(id)`, `editTask(id, newText)`, `deleteTask(id)`, `renderTasks()` functions
    - `addTask`: trim input, reject empty/whitespace (return `null`), reject case-insensitive duplicates (return `null`), generate unique id via `crypto.randomUUID()`
    - All mutations call `saveTasks`; wrap localStorage calls in try/catch
    - `renderTasks` re-renders only the affected DOM element on toggle
    - _Requirements: 5.1–5.9_
  - [ ]* 7.2 Write property test for task addition and structure
    - **Property 9: Task addition and structure** — valid text → returned Task has non-empty `id`, trimmed `text`, `completed: false`; appears in `loadTasks()`
    - **Validates: Requirements 5.1, 5.9**
  - [ ]* 7.3 Write property test for whitespace task rejection
    - **Property 10: Whitespace task rejection** — whitespace-only strings → `addTask` returns `null`, list length unchanged
    - **Validates: Requirements 5.2**
  - [ ]* 7.4 Write property test for duplicate task rejection
    - **Property 11: Duplicate task rejection** — any case variation of existing task text → `addTask` returns `null`, list length unchanged
    - **Validates: Requirements 5.3**
  - [ ]* 7.5 Write property test for toggle isolation
    - **Property 12: Toggle isolation** — `toggleTask(id)` flips only the targeted task's `completed`; all others unchanged
    - **Validates: Requirements 5.4**
  - [ ]* 7.6 Write property test for task deletion
    - **Property 13: Task deletion** — `deleteTask(id)` removes only the targeted task; all others remain
    - **Validates: Requirements 5.6**
  - [ ]* 7.7 Write property test for todo list persistence round-trip
    - **Property 14: Todo list persistence round-trip** — `loadTasks()` after any mutation reflects current in-memory state (mocked localStorage)
    - **Validates: Requirements 5.7, 5.8**
  - [x] 7.8 Implement `initTodoList()` — wire `#todo-input`, `#btn-add-todo`, `#todo-list`; show inline error on validation failure
    - _Requirements: 5.1–5.9_

- [x] 8. Implement Quick Links
  - [x] 8.1 Implement `loadLinks()`, `saveLinks(links)`, `addLink(name, url)`, `deleteLink(id)`, `renderLinks()` functions
    - `addLink`: reject URLs not starting with `http://` or `https://` (return `null`); generate unique id
    - Link cards render with `target="_blank"` and `rel="noopener noreferrer"`
    - Wrap localStorage calls in try/catch
    - _Requirements: 6.1–6.6_
  - [ ]* 8.2 Write property test for valid link acceptance
    - **Property 15: Valid link acceptance** — valid name + `http://` or `https://` URL → link appears in `loadLinks()`
    - **Validates: Requirements 6.1**
  - [ ]* 8.3 Write property test for invalid URL rejection
    - **Property 16: Invalid URL rejection** — URL not starting with `http://` or `https://` → `addLink` returns `null`, list length unchanged
    - **Validates: Requirements 6.2**
  - [ ]* 8.4 Write property test for link deletion
    - **Property 17: Link deletion** — `deleteLink(id)` removes only the targeted link; all others remain
    - **Validates: Requirements 6.4**
  - [ ]* 8.5 Write property test for links persistence round-trip
    - **Property 18: Links persistence round-trip** — `loadLinks()` after any mutation reflects current in-memory state (mocked localStorage)
    - **Validates: Requirements 6.5, 6.6**
  - [x] 8.6 Implement `initQuickLinks()` — wire `#link-name-input`, `#link-url-input`, `#btn-add-link`, `#links-container`; show inline error on validation failure
    - _Requirements: 6.1–6.6_

- [x] 9. Implement Theme Toggle
  - [x] 9.1 Implement `loadTheme()`, `applyTheme(theme)`, `toggleTheme()` functions
    - `loadTheme` defaults to `'light'` when no key in localStorage
    - `applyTheme` sets/removes `data-theme="dark"` on `<html>` and saves to localStorage key `dashboard_theme`
    - Wrap localStorage calls in try/catch
    - _Requirements: 7.1–7.6_
  - [ ]* 9.2 Write property test for theme toggle round-trip
    - **Property 19: Theme toggle round-trip** — `toggleTheme()` twice returns theme to original value
    - **Validates: Requirements 7.2**
  - [ ]* 9.3 Write property test for theme persistence round-trip
    - **Property 20: Theme persistence round-trip** — `applyTheme(theme)` then `loadTheme()` returns same value (mocked localStorage)
    - **Validates: Requirements 7.5, 7.6**
  - [x] 9.4 Implement `initTheme()` — call `applyTheme(loadTheme())` as the first initialization step on `DOMContentLoaded`; wire `#btn-theme-toggle`
    - _Requirements: 7.1–7.6_

- [x] 10. Wire all widgets and finalize `js/script.js`
  - [x] 10.1 Add `DOMContentLoaded` listener that calls `initTheme`, `initClock`, `initGreeting`, `initPomodoro`, `initTodoList`, `initQuickLinks` in order
    - _Requirements: 1.1, 1.2_
  - [x] 10.2 Add descriptive section comments throughout `js/script.js`
    - _Requirements: 9.5_
  - [ ]* 10.3 Write unit tests for initialization and accessibility
    - Verify clock interval starts on `DOMContentLoaded` (mock `setInterval`)
    - Verify Pomodoro initializes to "25:00" and start button is disabled while running
    - Verify `loadTheme()` returns `'light'` when no key in localStorage
    - Verify link cards render with `target="_blank"` and `rel="noopener noreferrer"`
    - Verify icon-only buttons have `aria-label` attributes
    - _Requirements: 9.1, 9.2_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations each
- Test files live under `tests/unit/` and `tests/property/` as described in the design
- Each task references specific requirements for traceability
- `initTheme` must run first to avoid a flash of wrong theme on load
