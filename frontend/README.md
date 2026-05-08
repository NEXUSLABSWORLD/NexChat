# LinguChat Frontend

React/Vite frontend for **LinguChat**, a real-time messaging app that translates messages into the recipient's preferred language before delivery.

## Current Scope

This frontend currently provides a polished prototype for the main user flows described in the project documentation:

- Login and registration screens.
- Required primary language selection.
- Conversation list with contact search.
- Telegram-inspired chat layout.
- Translated message display with an option to reveal the original text.
- Online/offline presence, typing indicator, and read/delivered states.
- Light/dark theme toggle.
- Responsive mobile layout.

The UI uses mocked conversation data for now so the frontend can be reviewed before the Laravel API and WebSocket events are connected.

## Tech Stack

- React
- Vite
- CSS
- Axios
- Socket.io Client
- Lucide React

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## Backend Integration Plan

The next frontend tasks are:

1. Connect authentication forms to the backend login/register endpoints.
2. Store the returned auth token and attach it to API requests.
3. Replace mocked conversations with API data.
4. Connect `socket.io-client` to real-time message events.
5. Send new messages through the backend so translation can happen server-side.
6. Update messages when translated content is returned by the server.

Expected message payload shape:

```json
{
  "id": 101,
  "sender_id": 1,
  "conversation_id": 10,
  "content_translated": "Bonjour, comment allez-vous ?",
  "content_original": "Hello, how are you?",
  "source_lang": "en",
  "target_lang": "fr"
}
```

## Project Structure

```text
frontend/
  src/
    App.jsx
    App.css
    index.css
    main.jsx
  public/
  package.json
  vite.config.js
```

## Notes

This app is intentionally frontend-first at this stage. It is ready for API and WebSocket wiring once the backend contracts are available.
