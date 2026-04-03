# CLAUDE.md

## Project Overview

Raycast extension "Simple RTM" — Remember The Milk にタスクを追加するための拡張機能。
個人利用目的。将来的に Raycast Store への公開の可能性あり。

## Tech Stack

- TypeScript
- Raycast Extension API (`@raycast/api`, `@raycast/utils`)
- RTM REST API (ライブラリ不使用、認証含め自前実装)
- Jest (テスト)

## Project Structure

```
src/             # Source files
assets/          # Extension icons etc.
```

## Scope

機能はタスク追加(`add-task`)のみ。それ以外の機能(一覧・完了・削除等)は対象外。

## Coding Conventions

- Comments in English
- Code and commit messages in English

## Development

```bash
npm run dev    # Start dev mode
npm run build  # Build
npm run lint   # Lint
```

## Testing

- Framework: Jest
- テストは書く方針
