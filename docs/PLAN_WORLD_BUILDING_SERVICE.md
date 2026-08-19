# Техническое задание: Local-first Worldbuilding Platform

## 0. Краткое описание проекта

Необходимо разработать современную web-платформу TaleOrience для world-building, предназначенную прежде всего для:

* писателей;
* Game Masters / Dungeon Masters;
* авторов RPG-кампаний;
* создателей игровых вселенных;
* небольших игровых команд;
* людей, создающих большие fictional universes.

Продукт должен объединять возможности wiki, редактора документов, knowledge graph, asset manager, системы шаблонов и визуальной организации мира.

Ключевой принцип:

> **Пользователь должен ощущать, что он пишет и проектирует мир, а не заполняет базу данных.**

Система должна позволять свободно писать основной текст в Markdown, комбинировать его с изображениями, схемами, таблицами и другими блоками, организовывать контент в иерархию GameObject'ов и использовать Templates как заготовки/Prefab'ы.

Архитектура должна быть рассчитана на три сценария:

1. публичный SaaS;
2. self-hosted deployment;
3. локальная/домашняя установка, например на Mac mini.

Первый этап — обычное web-приложение.

PWA и полноценная offline/collaborative архитектура должны быть предусмотрены архитектурно, но не должны усложнять MVP без необходимости.

---

# 1. Главные продуктовые принципы

## 1.1. Свободное письмо важнее строгой схемы

Основной контент пользователя — свободный текст.

Пользователь не должен быть вынужден сначала определить:

```text
Character
Name
Race
Age
Profession
...
```

чтобы начать писать.

Он может просто открыть страницу и написать:

```markdown
# Moonlight Citadel

Город был основан...
```

Структурированные данные, Schema и Properties являются дополнительным уровнем, а не обязательной основой.

Приоритет:

```text
Свободное письмо
        ↓
Blocks
        ↓
Templates
        ↓
References / Metadata
        ↓
опционально Schema
```

---

## 1.2. Page — это рабочее пространство

Page не является строгой записью базы данных.

Page представляет собой набор Blocks.

Пример:

```text
Page: History

├── TextBlock
├── ImageBlock
├── TextBlock
├── QuoteBlock
├── TimelineBlock
└── TextBlock
```

Пользователь свободно меняет структуру страницы.

---

## 1.3. GameObject — смысловая единица мира

GameObject — основной объект world-building системы.

Примеры:

```text
Moonlight Citadel
Arlen Vey
Kingdom of Aster
Black Order
The Silver Sea
Battle of Dawn
Magic System
Quest: The Lost Crown
```

GameObject может содержать:

* несколько Pages;
* дочерние GameObject'ы;
* Banner;
* Inspector / metadata;
* references;
* tags;
* relations;
* timeline;
* другие расширения.

---

## 1.4. GameObject похож на Prefab из Unity

GameObject Template должен позволять создавать целые заранее подготовленные структуры.

Например:

```text
Dungeon Template

Dungeon
├── Main
├── History
├── Layout
├── Encounters
├── NPCs
├── Loot
│
├── Entrance
├── Floor 1
│   ├── Room 1
│   ├── Room 2
│   └── Room 3
└── Floor 2
```

Создание нового Dungeon из Template должно создавать независимую копию всей структуры.

Это аналогично Prefab/Template подходу в игровых движках.

---

# 2. Технологический стек

## 2.1. Frontend

Основной frontend:

* TypeScript;
* React;
* Vite.

UI должен быть responsive и ориентирован прежде всего на desktop web.

Дополнительно интерфейс должен адаптироваться под планшеты.

---

## 2.2. PWA

Приложение должно иметь возможность работать как PWA.

Целевые устройства:

1. Desktop browser — основной сценарий;
2. Tablet — полноценный поддерживаемый сценарий;
3. Smartphone — базовая usable-версия.

PWA не должна становиться обязательной причиной усложнения MVP.

На первом этапе достаточно подготовить архитектуру так, чтобы:

* приложение можно было установить;
* сохранялась информация о последнем открытом проекте;
* базовый UI корректно работал на touch;
* позднее можно было добавить offline mode.

---

## 2.3. Backend

Backend должен быть отдельным от frontend.

Рекомендуемая архитектура:

```text
React / TypeScript
        ↓
Application API
        ↓
Domain / World Engine
        ↓
Persistence
```

Backend должен поддерживать как минимум:

* REST API или аналогичный HTTP API;
* WebSocket/event channel в будущем;
* authentication в SaaS-режиме;
* project management;
* persistence.

---

## 2.4. Database

Для self-hosted и небольших локальных инсталляций:

**SQLite**.

Для SaaS:

**PostgreSQL**.

Domain layer не должен зависеть от конкретной СУБД.

Идея:

```text
World Engine
     ↓
Repository interfaces
     ↓
SQLite / PostgreSQL / другое хранилище
```

Таким образом одна и та же бизнес-логика работает:

```text
Local
Self-hosted
Cloud
```

---

## 2.5. Search

На первом этапе:

**SQLite FTS5**.

Не использовать Elasticsearch/Meilisearch/Typesense без реальной необходимости.

Поиск должен работать по:

* названиям GameObject'ов;
* Page;
* Markdown;
* Tags;
* другим индексируемым metadata.

---

## 2.6. Editor

Редактор должен поддерживать block-oriented модель.

Рассмотреть:

* Tiptap / ProseMirror;
* Milkdown.

Главное требование:

> Markdown должен быть first-class citizen.

TextBlock должен хранить Markdown или представление, которое без потерь экспортируется в Markdown.

Необходимо избежать ситуации, когда Markdown является лишь импортом/экспортом rich-text документа.

---

## 2.7. State management

Для frontend UI state можно использовать Zustand.

Но доменное состояние мира не должно быть привязано к Zustand.

Должен существовать отдельный World Store / World Engine.

Пример:

```ts
world.gameObjects.create(...)
world.pages.create(...)
world.blocks.update(...)
world.templates.instantiate(...)
```

React является потребителем этого API, а не владельцем domain model.

---

## 2.8. Graph visualization

Для визуализации связей можно использовать:

* React Flow;
* Cytoscape.js;
* либо аналогичную библиотеку.

Graph visualization не является обязательной частью первого MVP, но references должны быть заложены в модель с самого начала.

---

## 2.9. Maps

В будущем:

* MapLibre GL;
* либо другой подходящий map/canvas engine.

Необходимо предусмотреть возможность создания MapBlock, но полноценная GIS-система не входит в MVP.

---

# 3. Архитектурные слои

Система должна быть разделена минимум на четыре слоя.

```text
┌────────────────────────────────────────┐
│                 UI                     │
│ React / PWA / Responsive Interface     │
└────────────────────┬───────────────────┘
                     │
┌────────────────────▼───────────────────┐
│          Application Layer             │
│ Commands / Queries / Undo / Redo       │
└────────────────────┬───────────────────┘
                     │
┌────────────────────▼───────────────────┐
│             World Engine               │
│ GameObjects / Pages / Blocks /          │
│ Templates / References / Metadata       │
└────────────────────┬───────────────────┘
                     │
┌────────────────────▼───────────────────┐
│             Persistence                │
│ SQLite / PostgreSQL / repositories     │
└────────────────────────────────────────┘
```

---

# 4. UI Layer

UI отвечает только за:

* отображение;
* взаимодействие пользователя;
* drag-and-drop;
* редакторы;
* navigation;
* responsive layout.

UI не должен самостоятельно изменять внутренние коллекции.

Плохо:

```ts
page.blockIds.push(blockId)
```

Хорошо:

```ts
world.blocks.move(blockId, pageId, index)
```

UI не должен знать, хранится ли объект в:

* Map;
* SQLite;
* PostgreSQL;
* IndexedDB;
* server memory.

---

# 5. Application Layer

Application Layer предоставляет операции над системой.

Примеры:

```ts
CreateGameObject
DeleteGameObject
MoveGameObject
CreatePage
DeletePage
DuplicatePage
CreateBlock
UpdateBlock
MoveBlock
AddTag
RemoveTag
CreateTemplate
InstantiateTemplate
```

Этот слой также является потенциальным местом для:

* undo/redo;
* commands;
* validation;
* transactions;
* permissions в будущем;
* audit events;
* synchronization.

---

# 6. World Engine

World Engine — центральная бизнес-модель приложения.

Он не должен зависеть от React.

Основные понятия:

```text
Project
GameObject
Page
Block
Asset
Template
Reference
InspectorBlock
Tag
```

---

# 7. Runtime storage model

В runtime рекомендуется использовать плоские коллекции по GUID.

Например:

```ts
interface WorldState {
    gameObjects: Map<Guid, GameObject>
    pages: Map<Guid, Page>
    blocks: Map<Guid, Block>
    assets: Map<Guid, Asset>
    templates: Map<Guid, Template>
    inspectorBlocks: Map<Guid, InspectorBlock>
}
```

Это является одним из основных архитектурных принципов проекта.

Не следует глубоко вкладывать сущности друг в друга.

Плохо:

```ts
GameObject {
    pages: [
        {
            blocks: [
                {...},
                {...}
            ]
        }
    ]
}
```

Предпочтительно:

```ts
GameObject {
    id
    pageIds
    childIds
}

Page {
    id
    gameObjectId
    blockIds
}

Block {
    id
    pageId
}
```

Таким образом система представляет собой граф объектов, а не дерево вложенных JSON-документов.

---

# 8. Почему используется Dictionary/Map<Guid, Entity>

Основные преимущества:

* O(1) lookup по ID;
* простые references;
* отсутствие глубоких структур;
* удобное перемещение сущностей;
* удобный undo/redo;
* удобное копирование;
* удобная сериализация;
* удобная работа с relational DB;
* потенциально удобная синхронизация;
* независимость от UI.

Пример:

```ts
world.blocks.get(blockId)
```

вместо обхода всех страниц.

---

# 9. Главный принцип References

Сущности должны ссылаться друг на друга через GUID.

Например:

```ts
GameObject {
    id: "city-123"
    parentId: "kingdom-001"
    childIds: [...]
    pageIds: [...]
}
```

```ts
Page {
    id: "page-001"
    gameObjectId: "city-123"
    blockIds: [...]
}
```

```ts
Block {
    id: "block-001"
    pageId: "page-001"
    type: "text"
    data: ...
}
```

Никаких глубоких object references в persistence model.

---

# 10. GameObject

GameObject — основной узел иерархии.

Пример интерфейса:

```ts
interface GameObject {
    id: Guid

    parentId: Guid | null
    childIds: Guid[]

    name: string
    icon?: string

    pageIds: Guid[]

    bannerAssetId?: Guid

    inspectorBlockIds: Guid[]
}
```

GameObject отображается в левом navigation tree.

Пользователь должен иметь возможность:

* создать;
* переименовать;
* удалить;
* переместить;
* вложить;
* свернуть;
* развернуть;
* изменить иконку;
* скрыть;
* добавить Banner.

---

# 11. Page

Page принадлежит GameObject.

Каждый новый GameObject по умолчанию получает:

```text
Main
```

Page содержит Blocks.

```ts
interface Page {
    id: Guid

    gameObjectId: Guid

    title: string
    icon?: string

    blockIds: Guid[]

    createdAt: Date
    updatedAt: Date
}
```

Рекомендуемое ограничение на количество Pages внутри одного GameObject — например, 100 на первом этапе.

Это ограничение должно быть configurable и не должно быть фундаментальным ограничением модели.

Page должна поддерживать:

* создание;
* удаление;
* rename;
* duplicate;
* reorder;
* tab navigation.

---

# 12. Block

Block — универсальный контейнер контента.

Основная модель:

```ts
interface Block {
    id: Guid

    pageId: Guid

    type: BlockType

    data: unknown

    createdAt: Date
    updatedAt: Date
}
```

Пример типов:

```text
text
image
gallery
quote
callout
divider
table
video
audio
map
diagram
timeline
embed
reference
custom
```

Начальный MVP:

```text
Text
Image
Gallery
Quote
Callout
Divider
Table
Embed
```

---

# 13. TextBlock

TextBlock является самым важным типом Block.

```ts
interface TextBlock {
    type: "text"

    content: string
}
```

`content` должен поддерживать Markdown.

Пользователь должен иметь возможность писать обычный текст без обязательной структуры.

Например:

```markdown
# История города

Селенская стена была построена...

## Архитектура

...

[[Moonlight Citadel]]
```

---

# 14. Почему Page не должна храниться одним Markdown-файлом

Необходимо разделить:

```text
Page
 ├── TextBlock
 ├── ImageBlock
 ├── DiagramBlock
 ├── TimelineBlock
 └── TextBlock
```

Markdown используется внутри TextBlock.

Это позволяет добавлять сложные интерактивные элементы:

* схемы;
* карты;
* galleries;
* timeline;
* embedded pages;
* database views;
* custom widgets.

Page остаётся композицией блоков.

---

# 15. Asset

Все ассеты проекта должны находиться в едином Asset subsystem.

```ts
interface Asset {
    id: Guid

    projectId: Guid

    type: AssetType
    path: string
    mimeType: string

    size?: number
    width?: number
    height?: number

    metadata?: unknown
}
```

Asset должен храниться отдельно от Block.

ImageBlock:

```ts
{
    type: "image",
    assetId: "asset-123"
}
```

а не:

```ts
{
    type: "image",
    imageData: ...
}
```

Это позволяет:

* использовать один asset в нескольких местах;
* делать asset browser;
* искать assets;
* заменять assets;
* удалять assets;
* проверять broken references.

---

# 16. Asset Browser

Проект должен иметь отдельный раздел Assets.

Минимально:

```text
Assets
├── My Files
├── Images
├── Maps
├── Audio
└── Other
```

Пользователь должен иметь возможность:

* upload;
* delete;
* rename;
* create folder;
* move;
* search;
* preview;
* использовать Asset в Blocks.

---

# 17. Banner

GameObject может иметь Banner.

Banner является ссылкой на Asset:

```ts
GameObject {
    bannerAssetId?: Guid
}
```

Banner относится к GameObject, а не Page.

---

# 18. Inspector / Right Sidebar

Metadata относится к **GameObject**, а не Page.

Это принципиально.

Пример:

```text
GameObject
│
├── Main
├── History
├── Architecture
├── Secrets
│
└── Inspector
    ├── Tags
    ├── Rating
    ├── Relations
    ├── Timeline
    └── Comments
```

Все Pages описывают один и тот же GameObject, поэтому metadata является общей.

---

# 19. InspectorBlock

Внутреннее название желательно отделить от UI-термина `RightSideBlock`.

Предпочтительно:

```ts
interface InspectorBlock {
    id: Guid

    gameObjectId: Guid

    type: InspectorBlockType

    order: number

    data: unknown
}
```

Типы:

```text
tags
rating
relations
timeline
comments
properties
sources
custom
```

UI может отображать Inspector справа, сверху, в modal или иначе.

Domain model не должна зависеть от того, что Inspector физически находится справа.

---

# 20. Tags

Tags принадлежат GameObject.

Пример:

```text
#city
#capital
#ancient
#architecture
```

Tags должны использоваться для:

* поиска;
* фильтрации;
* организации мира;
* future queries.

Не создавать отдельный GameObject ради Tag.

---

# 21. Relations

GameObject может ссылаться на другие GameObject'ы.

Например:

```text
Moonlight Citadel
    located_in
        Kingdom of Aster
```

```text
Arlen
    member_of
        Black Order
```

```text
Battle of Dawn
    happened_at
        Silver Valley
```

References должны быть GUID-based.

---

# 22. Markdown References

Пользователь должен иметь возможность писать:

```markdown
[[Moonlight Citadel]]
```

и получать ссылку на GameObject.

Также желательно поддержать:

```markdown
[[Moonlight Citadel|столица]]
```

Backlinks должны быть доступны в будущем:

```text
Referenced by:
- The Battle of Dawn
- Arlen
- Kingdom of Aster
```

---

# 23. Templates

Система должна поддерживать два разных типа Templates.

## Page Template

Page Template создаёт одну Page с заранее подготовленными Blocks.

Пример:

```text
Character Page Template

├── TextBlock: Overview
├── ImageBlock
├── TextBlock: Appearance
├── TextBlock: Personality
├── TextBlock: History
└── TextBlock: Relationships
```

Template является scaffolding.

После создания Page пользователь может полностью изменить её.

---

# 24. GameObject Template

GameObject Template создаёт целую структуру.

Например:

```text
Character Template

Character
├── Main
├── Biography
├── Relationships
├── Secrets
└── Inspector
    ├── Tags
    ├── Rating
    └── Relations
```

Или:

```text
Dungeon Template

Dungeon
├── Main
├── History
├── Layout
├── Encounters
├── NPCs
├── Loot
├── Entrance
├── Floor 1
│   ├── Room 1
│   └── Room 2
└── Floor 2
```

---

# 25. Template ≠ Live Inheritance

После создания объекта из Template он должен стать независимым.

Плохо:

```text
Template
   ↓
live inheritance
   ↓
Page
```

Предпочтительно:

```text
Template
   ↓ instantiate
deep copy
   ↓
independent GameObject/Page/Blocks
```

Изменение Template не должно автоматически изменять ранее созданные объекты.

---

# 26. Template Reference Remapping

При копировании Template необходимо автоматически заменять внутренние references.

Пример:

```text
Original:

Dungeon A
├── Guardian A
└── Treasure A

Guardian A → protects → Treasure A
```

После создания:

```text
Dungeon B
├── Guardian B
└── Treasure B
```

должно получиться:

```text
Guardian B → protects → Treasure B
```

а не:

```text
Guardian B → protects → Treasure A
```

Для этого при cloning необходимо создать:

```text
oldGuid → newGuid
```

mapping и выполнить reference remapping.

Это должно быть заложено в архитектуру Template system с самого начала.

---

# 27. Schemas — сознательно НЕ MVP

Schema system является важной будущей возможностью, но **не должна определять архитектуру первой версии**.

Проблема строгой Schema-first модели:

```text
Character
Name:
Race:
Age:
Profession:
```

заключается в том, что писатели и GM'ы часто хотят сначала писать, а не заполнять формы.

Поэтому система должна поддерживать три уровня свободы:

```text
LEVEL 1
Free writing
Markdown + Blocks

LEVEL 2
Templates
готовая структура

LEVEL 3
Schemas
строго структурированные данные
```

---

# 28. Будущая Schema System

В будущем пользователь сможет определить собственные типы.

Например:

```text
Character

name: string
race: string
age: number
culture: relation<Culture>
home: relation<Place>
factions: relation<Faction[]>
```

или:

```text
Starship

class: string
manufacturer: string
crew: number
capacity: number
location: relation<Place>
```

Но Schema должна быть:

* optional;
* расширяемой;
* пользовательской;
* совместимой с обычными Pages;
* совместимой с Templates.

Schema не должна запрещать свободное письмо.

---

# 29. Возможная модель Schema в будущем

Например:

```ts
Schema {
    id
    name

    fields: SchemaField[]
}
```

```ts
SchemaField {
    id
    name
    type
    required
    defaultValue
}
```

Schema может использоваться для:

* Properties;
* filtering;
* queries;
* structured search;
* validation;
* AI consistency checks;
* generated views.

Но Page всё равно должна оставаться свободным Block-based документом.

---

# 30. Почему ECS не должен быть публичной концепцией

Система может использовать ECS-like подход внутри.

Но пользователь не должен думать:

> «Мне нужно создать Entity с Component Position.»

Он должен думать:

> «Это город.»

ECS/graph/schema — технический механизм.

UX:

```text
GameObject
Page
Block
Template
Inspector
```

---

# 31. Domain invariants

Система должна соблюдать следующие правила.

### Rule 1

Каждая сущность имеет уникальный GUID.

### Rule 2

Entities не хранят глубокие копии других entities.

### Rule 3

Связи между entities представлены GUID.

### Rule 4

Изменение relationships проходит через Domain/Application API.

Нельзя позволять UI делать:

```ts
page.blockIds.push(...)
```

Напрямую.

### Rule 5

Каждый Block принадлежит одной Page.

### Rule 6

Каждая Page принадлежит одному GameObject.

### Rule 7

Каждый GameObject может иметь parent GameObject или быть root.

### Rule 8

Inspector metadata принадлежит GameObject.

### Rule 9

Assets не принадлежат конкретному Block напрямую — Block хранит Asset reference.

### Rule 10

Templates не являются live inheritance.

### Rule 11

TextBlock должен поддерживать Markdown.

### Rule 12

Page не должна требовать Schema.

### Rule 13

Schema никогда не должна мешать свободному письму.

### Rule 14

UI не должен зависеть от конкретной persistence technology.

### Rule 15

Domain layer не должен зависеть от React.

---

# 32. Undo / Redo

Архитектура должна быть подготовлена под undo/redo.

Предпочтительно использовать command-based подход:

```text
CreateBlock
UpdateBlock
MoveBlock
DeleteBlock
MoveGameObject
RenamePage
AddTag
RemoveTag
```

Каждая операция должна быть потенциально обратимой.

Например:

```text
MoveBlock
    ↓
Undo
    ↓
MoveBlockBack
```

Не обязательно реализовывать идеальный undo/redo до MVP, но Domain API должен позволять это сделать.

---

# 33. Events

В будущем доменная система может генерировать события:

```text
GameObjectCreated
GameObjectDeleted
GameObjectMoved

PageCreated
PageDeleted
PageUpdated

BlockCreated
BlockUpdated
BlockMoved

AssetAdded
AssetDeleted

TagAdded
RelationCreated
```

Эти события потенциально используются для:

* undo/redo;
* collaboration;
* audit history;
* synchronization;
* analytics;
* AI indexing.

---

# 34. Persistence

Runtime:

```ts
Map<Guid, GameObject>
Map<Guid, Page>
Map<Guid, Block>
...
```

Persistence:

```text
game_objects
pages
blocks
assets
templates
inspector_blocks
tags
relations
```

Для SQLite/PostgreSQL структура должна быть максимально близкой к Domain model.

---

# 35. Recommended database structure

Пример:

```text
projects
---------
id
name
created_at
updated_at
```

```text
game_objects
------------
id
project_id
parent_id
name
icon
banner_asset_id
created_at
updated_at
```

```text
pages
-----
id
game_object_id
title
sort_order
created_at
updated_at
```

```text
blocks
------
id
page_id
type
sort_order
data_json
created_at
updated_at
```

```text
assets
------
id
project_id
path
mime_type
metadata_json
```

```text
templates
---------
id
project_id
type
name
data_json
```

Дополнительные таблицы:

```text
tags
game_object_tags
relations
inspector_blocks
comments
```

---

# 36. MVP

MVP должен быть небольшим.

Основной user journey:

```text
Create Project
      ↓
Create GameObject
      ↓
GameObject автоматически получает Main Page
      ↓
Write Markdown
      ↓
Add Image
      ↓
Add another Block
      ↓
Create another Page
      ↓
Add Tags
      ↓
Create Reference
      ↓
Create Template
      ↓
Create another GameObject from Template
      ↓
Search
```

Если этот цикл удобный — фундамент продукта успешен.

---

# 37. MVP Block types

Обязательные:

```text
Text
Image
Gallery
Quote
Callout
Divider
Table
Embed
```

Второй этап:

```text
Video
Audio
Map
Diagram
Timeline
Database View
Reference
```

---

# 38. MVP navigation

Основной layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Top Bar                                                 │
├──────────────┬────────────────────────────┬─────────────┤
│              │                            │             │
│ GameObject   │         Page               │ Inspector   │
│ Tree         │                            │             │
│              │   Blocks                   │ Metadata    │
│              │                            │             │
│              │                            │             │
└──────────────┴────────────────────────────┴─────────────┘
```

Левая панель:

* Project navigation;
* GameObject hierarchy;
* search.

Центр:

* текущий GameObject;
* Page tabs;
* Blocks.

Правая панель:

* GameObject Inspector.

На tablet layout панели должны адаптироваться.

---

# 39. User Stories — Project

* Как пользователь, я хочу создать Project, чтобы начать новый мир.
* Как пользователь, я хочу открыть существующий Project.
* Как пользователь, я хочу удалить Project.
* Как пользователь, я хочу экспортировать Project.
* Как пользователь, я хочу импортировать Project.

---

# 40. User Stories — GameObject

* Как пользователь, я хочу создать GameObject.
* Как пользователь, я хочу создать дочерний GameObject.
* Как пользователь, я хочу перемещать GameObject drag-and-drop.
* Как пользователь, я хочу переименовывать GameObject.
* Как пользователь, я хочу менять его иконку.
* Как пользователь, я хочу скрывать GameObject.
* Как пользователь, я хочу сворачивать и разворачивать дерево.
* Как пользователь, я хочу удалить GameObject.
* Как пользователь, я хочу добавить Banner.

---

# 41. User Stories — Pages

* Как пользователь, я хочу автоматически получать Main Page при создании GameObject.
* Как пользователь, я хочу создавать Pages.
* Как пользователь, я хочу переименовывать Pages.
* Как пользователь, я хочу менять порядок Pages.
* Как пользователь, я хочу удалять Pages.
* Как пользователь, я хочу дублировать Pages.
* Как пользователь, я хочу переключаться между Pages через tabs.

---

# 42. User Stories — Blocks

* Как пользователь, я хочу добавлять TextBlock.
* Как пользователь, я хочу писать Markdown.
* Как пользователь, я хочу добавлять изображения.
* Как пользователь, я хочу создавать galleries.
* Как пользователь, я хочу добавлять таблицы.
* Как пользователь, я хочу добавлять quotes.
* Как пользователь, я хочу добавлять callouts.
* Как пользователь, я хочу добавлять embeds.
* Как пользователь, я хочу менять порядок Blocks.
* Как пользователь, я хочу удалять Blocks.
* Как пользователь, я хочу дублировать Blocks.

---

# 43. User Stories — Templates

* Как пользователь, я хочу создать Page Template.
* Как пользователь, я хочу создать GameObject Template.
* Как пользователь, я хочу создать Template из существующего объекта.
* Как пользователь, я хочу создать Page из Template.
* Как пользователь, я хочу создать GameObject из Template.
* Как пользователь, я хочу редактировать Template.
* Как пользователь, я хочу, чтобы уже созданные объекты не изменялись после изменения Template.
* Как пользователь, я хочу, чтобы references внутри Template автоматически remap'ились при клонировании.

---

# 44. User Stories — Inspector

* Как пользователь, я хочу добавить Tag к GameObject.
* Как пользователь, я хочу удалить Tag.
* Как пользователь, я хочу фильтровать мир по Tag.
* Как пользователь, я хочу добавить Rating.
* Как пользователь, я хочу видеть Relations.
* Как пользователь, я хочу видеть Timeline.
* Как пользователь, я хочу добавлять Comments.
* Как пользователь, я хочу добавлять custom Inspector Blocks.
* Как пользователь, я хочу менять порядок Inspector Blocks.

---

# 45. User Stories — References

* Как пользователь, я хочу написать `[[GameObject]]` внутри текста.
* Как пользователь, я хочу перейти по ссылке.
* Как пользователь, я хочу видеть backlinks.
* Как пользователь, я хочу видеть связанные GameObject'ы.
* Как пользователь, я хочу визуализировать graph отношений.

---

# 46. User Stories — Assets

* Как пользователь, я хочу загружать Assets.
* Как пользователь, я хочу видеть Asset Browser.
* Как пользователь, я хочу создавать папки.
* Как пользователь, я хочу перемещать Assets.
* Как пользователь, я хочу удалять Assets.
* Как пользователь, я хочу использовать один Asset в нескольких Blocks.
* Как пользователь, я хочу искать Assets.

---

# 47. Что НЕ входит в MVP

Не реализовывать на первом этапе:

* обязательные Schemas;
* сложный ECS UI;
* AI;
* real-time collaboration;
* сложные permissions;
* accounts;
* billing;
* SaaS subscription system;
* полноценную GIS;
* CRDT;
* сложный offline sync;
* mobile native apps;
* marketplace;
* plugin marketplace;
* procedural world generation.

Архитектура должна позволять добавить эти возможности позже, но MVP не должен зависеть от них.

---

# 48. PWA — следующий этап

После стабильного web MVP:

```text
Web
 ↓
PWA
```

Необходимы:

* installable application;
* responsive tablet UI;
* touch interactions;
* service worker;
* базовый caching;
* возможность открыть последний Project;
* offline read;
* позднее offline editing.

---

# 49. Self-hosting

Self-hosting является важной частью стратегии проекта.

Целевой сценарий:

```text
Mac mini
    ↓
Docker Compose
    ↓
Worldbuilding Server
    ↓
LAN
    ↓
GM + Players + Writers
```

Пример:

```text
http://world.local
```

или:

```text
http://192.168.1.20:3000
```

Self-hosted deployment не должен требовать облачного аккаунта.

---

# 50. SaaS

В будущем можно добавить:

```text
Cloud
├── Accounts
├── Projects
├── Storage
├── Collaboration
├── Sharing
├── Backups
└── Billing
```

Возможная монетизация:

* storage;
* private projects;
* collaboration;
* backups;
* advanced AI;
* larger asset limits;
* version history;
* team management.

Self-hosted/community версия должна оставаться полноценным продуктом.

---

# 51. Collaboration — будущее

Архитектура должна предусматривать возможность:

```text
                    Server
                      │
             ┌────────┼────────┐
             │        │        │
           GM       Writer    Player
             │        │        │
             └────────┼────────┘
                      │
                    World
```

В будущем пользователи смогут одновременно редактировать Project.

Для этого пригодятся:

* domain events;
* commands;
* stable GUID;
* immutable-ish operations;
* versioning;
* WebSocket;
* eventually CRDT/OT.

Но CRDT не является MVP requirement.

---

# 52. Roles и Permissions — будущее

Потенциальные роли:

```text
Owner
Admin
GM
Writer
Editor
Player
Viewer
```

Пример:

### Owner

Полный доступ.

### Admin

Управление Project и пользователями.

### GM

Полный доступ к world content, включая secrets.

### Writer

Редактирование разрешённых объектов.

### Player

Доступ только к опубликованной части.

### Viewer

Read-only.

Особенно важна концепция **Secrets**.

Например GM может иметь:

```text
Public Page
Secret Page
GM Notes
```

Игрок не должен видеть secret content.

Но permissions system не должна усложнять базовый локальный режим.

---

# 53. AI — будущее

AI не должен быть фундаментом хранения данных.

Правильная последовательность:

```text
Structured World
       ↓
Graph / Search / Relations
       ↓
AI
```

AI сможет:

* находить противоречия;
* анализировать timeline;
* находить связанные объекты;
* искать lore;
* генерировать Template;
* предлагать Relations;
* анализировать персонажей;
* проверять consistency;
* отвечать на вопросы по миру.

Например:

> «Какие персонажи находились в Silverfall во время Battle of Dawn?»

Или:

> «Найди противоречия в возрасте персонажей.»

---

# 54. Schema — стратегически важное будущее направление

Schema не должна исчезнуть.

Она должна появиться после того, как:

* GameObject;
* Page;
* Block;
* Template;
* References;
* Inspector

будут стабильны.

Schema может стать следующим уровнем:

```text
Freeform Worldbuilding
        ↓
Templates
        ↓
Structured Properties
        ↓
Schemas
        ↓
Queries
        ↓
Consistency Engine
        ↓
AI
```

Таким образом пользователь сможет начать абсолютно свободно, а затем постепенно структурировать мир.

---

# 55. Возможный будущий Schema UX

Пользователь создаёт:

```text
Character
```

Schema:

```text
Name       string
Age        number
Species    relation
Home       relation<Place>
Faction    relation<Faction>
Birth      date
Death      date?
```

Но рядом всё равно остаётся:

```text
Pages

Main
Biography
Personality
Secrets
```

Schema отвечает за **данные**.

Pages отвечают за **рассказ**.

Это принципиально разные вещи.

---

# 56. Будущие Structured Views

После появления Schema можно сделать:

```text
Character Database
```

например:

| Name  | Race  | Age | Faction     | Status |
| ----- | ----- | --- | ----------- | ------ |
| Arlen | Human | 34  | Black Order | Alive  |
| Mira  | Elf   | 127 | None        | Alive  |

Но это будет View поверх существующих GameObject'ов, а не отдельная database entity.

---

# 57. Главная философия архитектуры

Необходимо сохранить следующую иерархию:

```text
PROJECT
  │
  ├── GAME OBJECTS
  │      │
  │      ├── CHILDREN
  │      │
  │      ├── PAGES
  │      │      │
  │      │      └── BLOCKS
  │      │
  │      ├── BANNER
  │      │
  │      └── INSPECTOR
  │             ├── TAGS
  │             ├── RELATIONS
  │             ├── TIMELINE
  │             ├── RATING
  │             └── COMMENTS
  │
  ├── ASSETS
  │
  └── TEMPLATES
```

Runtime:

```ts
Map<Guid, GameObject>
Map<Guid, Page>
Map<Guid, Block>
Map<Guid, Asset>
Map<Guid, Template>
Map<Guid, InspectorBlock>
```

References:

```text
GUID → GUID
```

---

# 58. Главные архитектурные правила

### Rule A — Freeform First

Пользователь всегда может просто писать.

### Rule B — Markdown First

Markdown является нативным форматом TextBlock.

### Rule C — Blocks, not giant documents

Page состоит из независимых Blocks.

### Rule D — GameObject is the semantic unit

Metadata относится к GameObject, а не Page.

### Rule E — Pages are views of the same object

Несколько Pages описывают один GameObject с разных сторон.

### Rule F — Templates are scaffolding

Template помогает создать структуру, но не ограничивает её.

### Rule G — Templates can instantiate whole trees

GameObject Template способен создавать дерево GameObject'ов, Pages и Blocks.

### Rule H — GUID everywhere

Ссылки между сущностями используют GUID.

### Rule I — Flat runtime storage

Entities находятся в `Map<Guid, Entity>`.

### Rule J — No deep object nesting

Внутри сущностей хранятся IDs, а не полноценные дочерние entities.

### Rule K — Domain owns mutations

UI никогда не должен напрямую мутировать Domain State.

### Rule L — Persistence is replaceable

Domain Engine не знает о SQLite/PostgreSQL.

### Rule M — UI terminology ≠ Domain terminology

Например `Right Sidebar` является UI, а `InspectorBlock` — domain concept.

### Rule N — Schema is optional

Schema не должна быть обязательной для создания или редактирования контента.

### Rule O — AI is not the foundation

AI работает поверх структурированного мира.

### Rule P — Collaboration comes later

Архитектура готовится к collaboration, но MVP не зависит от неё.

---

# 59. Приоритет разработки

## Phase 0 — Foundation

```text
Project
WorldState
GUID
Repository
GameObject
Page
Block
Asset
```

## Phase 1 — Core UX

```text
GameObject Tree
Page Tabs
Markdown
Blocks
Asset Browser
Inspector
Tags
```

## Phase 2 — References

```text
[[References]]
Backlinks
Relations
Search
```

## Phase 3 — Templates

```text
Page Templates
GameObject Templates
Prefab cloning
Reference remapping
```

## Phase 4 — Productivity

```text
Undo / Redo
Duplicate
Drag & Drop
Command system
Full-text search
```

## Phase 5 — PWA

```text
Installable PWA
Tablet UI
Touch
Caching
Basic offline
```

## Phase 6 — Self-host

```text
Docker
SQLite
LAN deployment
Configuration
Backups
```

## Phase 7 — Collaboration

```text
Authentication
Users
Roles
Permissions
WebSocket
Events
Concurrent editing
```

## Phase 8 — SaaS

```text
Cloud projects
PostgreSQL
Storage
Billing
Sharing
Backups
Team features
```

## Phase 9 — Schema

```text
Custom schemas
Properties
Relations
Queries
Structured views
Validation
```

## Phase 10 — AI

```text
Lore assistant
Consistency checking
Semantic search
Automatic relations
Timeline analysis
World queries
```

---

# 60. Итоговая концепция

Продукт должен находиться на пересечении:

```text
                 Worldbuilding
                      │
          ┌───────────┼───────────┐
          │           │           │
        Wiki       Markdown     Knowledge
                     Editor       Graph
          │           │           │
          └───────────┼───────────┘
                      │
                   Blocks
                      │
                GameObjects
                      │
                  Templates
                      │
                Structured Data
```

При этом пользовательский mental model должен быть предельно прост:

> **Создай объект → открой страницу → пиши → добавляй блоки → связывай объекты → организуй мир.**

Внутри система может быть сложной:

```text
GUID graph
Map-based entity storage
Commands
Events
Repositories
SQLite/PostgreSQL
Templates
Reference remapping
Future schemas
Future sync
```

Но пользователь никогда не должен быть вынужден понимать эту сложность.

Главная идея продукта:

> **Свободное письмо поверх мощного графового движка.**

Не пытаться заставить писателя работать как разработчик базы данных.

Не пытаться заставить GM создавать строгие entities.

Не пытаться сделать очередной Notion.

Сделать систему, где **GameObject — это сущность мира, Page — пространство рассказа об этой сущности, Block — атомарная единица контента, Template — Prefab для создания новых сущностей, Inspector — общий слой метаданных, а GUID-based World Engine связывает всё это в единый граф.**

Schema, AI, collaboration, roles, cloud sync и прочая «магия» должны строиться **поверх этого фундамента**, а не определять его.

Да. И Project здесь на самом деле не просто ещё одна сущность — это верхний уровень доменной модели, которого нам не хватало. Если один мир = один Project, то становится намного понятнее, где живут GameObject, Pages, Assets, Templates и настройки конкретного мира.

Я бы прямо сейчас зафиксировал это в ТЗ следующим образом.

Дополнение к ТЗ: Project и разделение Open Source / SaaS

1. Общая структура продукта

Система должна быть разделена на две части:

World Engine
│
├── Open Source Core
│   ├── Domain
│   ├── Editor
│   ├── Blocks
│   ├── Markdown / Tiptap
│   ├── Assets
│   ├── Templates
│   ├── Search
│   ├── Relations
│   ├── Local storage
│   ├── Import / Export
│   ├── PWA
│   └── Self-hosting
│
└── Private SaaS Layer
    ├── Accounts
    ├── Organizations
    ├── Billing
    ├── Subscriptions
    ├── Cloud projects
    ├── Cloud storage
    ├── Managed backups
    ├── Collaboration
    ├── Permissions
    ├── Notifications
    └── SaaS infrastructure

Open Source часть должна быть полноценным самостоятельным продуктом: пользователь должен иметь возможность скачать её, создать Project, работать локально и самостоятельно разместить приложение на своём сервере или Mac mini.

Private SaaS Layer не должен быть необходим для базовой работы World Engine. Он предоставляет управляемую облачную инфраструктуру и коммерческие сервисы поверх Open Source Core.

SaaS-приложение должно использовать тот же Open Source Core, а не содержать независимую копию редактора и доменной логики.

Архитектурно:

Open Source packages
        │
        ▼
World Engine Core
        │
        ├───────────────┐
        │               │
        ▼               ▼
Self-hosted app      SaaS app
                        │
                        ▼
                 Private Cloud Layer

Это разделение должно быть предусмотрено с самого начала, даже если приватная SaaS-часть будет реализована значительно позже.


---

2. Project — корневая сущность пользовательского мира

Project является верхнеуровневым контейнером системы.

Основное правило:

> Один Project представляет один самостоятельный мир, сеттинг, игру или рабочее пространство worldbuilding.



Например:

Cool Fantasy

может быть одним Project.

Cyberpunk 2142

— вторым Project.

Space Opera

— третьим.

Каждый Project полностью изолирован от других Project'ов на уровне данных, однако система должна позволять пользователю переносить определённые сущности между проектами.


---

3. Структура Project

Project содержит:

Project
│
├── GameObjects
│   ├── Characters
│   ├── Locations
│   ├── Factions
│   ├── Items
│   └── ...
│
├── Pages
│
├── Blocks
│
├── Assets
│   ├── Images
│   ├── Maps
│   ├── Files
│   └── ...
│
├── Templates
│   ├── GameObject Templates
│   └── Page Templates
│
├── Tags
│
├── Project metadata
│
└── Project settings

При этом физически данные могут продолжать храниться в нормализованных коллекциях:

Dictionary<Guid, Project>
Dictionary<Guid, GameObject>
Dictionary<Guid, Page>
Dictionary<Guid, Block>
Dictionary<Guid, Asset>
Dictionary<Guid, Template>

а принадлежность сущности Project определяется через projectId.

Например:

interface GameObject {
    id: Guid
    projectId: Guid
    parentId: Guid | null
    children: Guid[]
    pageIds: Guid[]
}

и:

interface Asset {
    id: Guid
    projectId: Guid
    ...
}

Таким образом, Project является логической границей данных, а не обязательным дополнительным уровнем вложенности каждой структуры.


---

4. Project metadata

Каждый Project должен иметь собственную метаинформацию.

Минимально:

interface Project {
    id: Guid

    name: string
    description: string

    bannerAssetId: Guid | null

    createdAt: Date
    updatedAt: Date

    settings: ProjectSettings

    isReadOnly: boolean
    isExample: boolean
}

Например Project:

Cool Fantasy

A dark fantasy world centered around the continent of Asterra.

[Banner]

или:

Cyberpunk 2142

A cyberpunk setting for a tabletop campaign.

[Banner]

Название, описание и banner должны редактироваться пользователем.


---

5. Project Banner

Project может иметь banner.

Banner должен ссылаться на Asset:

Project
   │
   └── bannerAssetId
             │
             ▼
          Asset

Не следует хранить непосредственно изображение внутри Project.

Так мы сохраняем единую систему Assets.

Позже один и тот же механизм можно использовать для:

Project banner
GameObject banner
Page cover
Image Block


---

6. GameObject остаётся следующим уровнем

После добавления Project иерархия становится:

Project
   │
   ├── GameObject
   │      │
   │      ├── Page
   │      │     └── Blocks
   │      │
   │      ├── Page
   │      │     └── Blocks
   │      │
   │      └── ...
   │
   ├── GameObject
   │
   └── GameObject

При этом GameObject может иметь собственные:

name
description
banner
tags
rating
comments
timeline
relations
metadata

То есть Right Sidebar относится к GameObject, а не к Page.


---

7. Project не должен быть частью GameObject

Важно не перепутать:

Project
└── GameObject
    └── Page
        └── Block

а не:

GameObject
└── Project

Project — это контейнер всего мира.

GameObject — объект внутри мира.

Page — документ, описывающий GameObject.

Block — содержимое Page.


---

8. Assets принадлежат Project

Все пользовательские Assets должны иметь projectId.

Например:

Cool Fantasy
├── Assets
│   ├── moonlight-citadel.jpg
│   ├── world-map.png
│   └── arlen.png
│
└── GameObjects
    ├── Moonlight Citadel
    └── Arlen Vey

Другой Project:

Cyberpunk 2142
├── Assets
│   ├── megacorp.jpg
│   ├── neo-tokyo.png
│   └── character.jpg
│
└── GameObjects

Assets одного Project не должны случайно становиться видимыми в другом.


---

9. Templates принадлежат Project

Это тоже нужно явно зафиксировать.

Каждый Project имеет собственную библиотеку Templates:

Project
└── Templates
    ├── GameObject Templates
    └── Page Templates

Например Cool Fantasy:

GameObject Templates
├── Character
├── Location
├── Faction
├── Item
└── Creature

и:

Page Templates
├── Character Overview
├── Location Description
├── Quest
└── Faction

Cyberpunk 2142 может иметь совершенно другую систему:

GameObject Templates
├── Corporation
├── Augmentation
├── District
├── Fixer
└── Gang


---

10. Но Templates и Assets можно переносить между Project

Это обязательная функциональность.

Пользователь должен иметь возможность:

Cool Fantasy
    │
    │ export/copy
    ▼
Cyberpunk 2142

перенести Template.

Например:

Cool Fantasy
└── Templates
    └── Character
             │
             ▼
Cyberpunk 2142
└── Templates
    └── Character

То же самое для Assets.


---

11. Перенос Asset должен учитывать зависимости

Например пользователь переносит:

Character Template

а Template использует:

character-placeholder.png

Система не должна получить:

Template → Asset GUID из другого Project

Вместо этого операция импорта должна разрешить зависимости.

Например:

Source Project

Template
   │
   └── Asset A

при переносе:

Target Project

Template'
   │
   └── Asset B

где Asset B является скопированной версией Asset A.

Это особенно важно для GameObject Templates.


---

12. Копирование GameObject между Project

Позже можно поддержать и эту операцию.

Например:

Cool Fantasy
└── Moonlight Citadel
       ├── Main
       ├── History
       ├── Architecture
       └── Characters

Пользователь выбирает:

> Copy to another Project.



Система должна определить зависимости:

GameObject
├── Pages
├── Blocks
├── Assets
├── Tags
├── Relations
└── references to other GameObjects

и предложить стратегию импорта.

Это уже более сложная операция, поэтому для MVP её можно оставить за пределами первой версии.

Но архитектура GUID + projectId должна позволять реализовать её позднее.


---

13. Project Clone

Нужна отдельная операция:

> Clone Project



Она создаёт полностью независимую копию Project.

Например:

Cool Fantasy
      │
      │ Clone
      ▼
Cool Fantasy — Copy

После клонирования:

Project A
id = A

и:

Project B
id = B

имеют разные идентификаторы.

Все принадлежащие сущности также должны получить новые GUID:
GameObject A → GameObject B
Page A       → Page B
Block A      → Block B
Asset A      → Asset B
Template A   → Template B

При этом внутренние ссылки должны быть автоматически переназначены.

То есть:

A: Page
 └── reference → GameObject_A

после клонирования становится:

B: Page
 └── reference → GameObject_B

а не продолжает ссылаться на оригинальный Project.

Это ещё одна причина, почему наша модель с GUID очень хорошо подходит для системы.


---

14. Read-only Example Projects

Система должна поддерживать встроенные демонстрационные Projects.

Например при установке:

Projects
├── My Worlds
│   ├── Cool Fantasy
│   └── Cyberpunk 2142
│
└── Examples
    ├── Fantasy World
    ├── Sci-Fi Campaign
    └── Detective Mystery

Example Projects должны быть:

isExample = true
isReadOnly = true

Пользователь может открыть их и изучить.

Например:

> Fantasy World



показывает:

GameObjects
Pages
Templates
Assets
Tags
Relations

Это одновременно:

1. документация;


2. демонстрация возможностей;


3. playground;


4. источник примеров для новых пользователей.




---

15. Но Example Project должен быть клонируемым

Read-only означает:

> Нельзя изменить оригинал.



Но пользователь должен иметь кнопку:

> Clone



После этого:

Example: Fantasy World
        │
        ▼
Fantasy World — Copy

и новая версия становится:

isExample = false
isReadOnly = false

Пользователь может полностью её редактировать.

Это значительно лучше обычного tutorial, потому что пользователь сразу получает настоящий рабочий Project.


---

16. Операции над Project

Минимальный набор:

Create Project
Open Project
Rename Project
Edit Description
Change Banner
Duplicate / Clone Project
Delete Project
Archive Project
Export Project
Import Project

Для Example Project:

Open
Clone
Export

но:

Rename original       ✗
Edit original         ✗
Delete original       ✗


---

17. Удаление Project

Я бы не делал мгновенное физическое удаление.

Пользователь нажимает:

> Delete Project



и получает подтверждение:

Delete "Cool Fantasy"?

This will remove:
• 142 GameObjects
• 381 Pages
• 1,204 Blocks
• 87 Assets
• 23 Templates

This action cannot be undone.

Для SaaS позднее можно сделать:

Trash

с возможностью восстановления.

Для локальной версии MVP можно сделать обычное удаление с подтверждением и экспортом перед удалением.


---

18. Project Manager

В UI нужен отдельный экран/режим:

Projects

Например:

┌─────────────────────────────────────┐
│ Projects                            │
│                                     │
│ [ + New Project ]                   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │      Cool Fantasy             │   │
│ │      [banner]                 │   │
│ │                               │   │
│ │      142 objects              │   │
│ │      23 templates             │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │      Cyberpunk 2142           │   │
│ │      [banner]                 │   │
│ └───────────────────────────────┘   │
│                                     │
│ Examples                            │
│ ┌───────────────────────────────┐   │
│ │      Fantasy World            │   │
│ │      READ ONLY                │   │
│ │      [Clone]                  │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘

Это фактически домашний экран приложения.


---

19. Project должен быть первой точкой навигации

После запуска приложения пользователь не должен сразу попадать в последний GameObject.

Правильная концепция:

Application
    ↓
Project Manager
    ↓
Project
    ↓
GameObject
    ↓
Page
    ↓
Block

Можно, конечно, запоминать последний открытый Project и автоматически открывать его при следующем запуске.

Но концептуально Project является верхним уровнем.


---

20. Важное правило для базы данных

Мы сохраняем ранее выбранную модель:
Dictionary<Guid, Project>
Dictionary<Guid, GameObject>
Dictionary<Guid, Page>
Dictionary<Guid, Block>
Dictionary<Guid, Asset>
Dictionary<Guid, Template>

Каждая сущность, относящаяся к Project, имеет:

projectId: Guid

Например:

interface Page {
    id: Guid
    projectId: Guid

    gameObjectId: Guid
    title: string

    blockIds: Guid[]
}

и:

interface Block {
    id: Guid
    projectId: Guid

    pageId: Guid
    type: BlockType

    data: unknown
}

Таким образом, все сущности можно эффективно получать по ID, а Project является логической областью данных.


---

21. Project не должен становиться огромным aggregate object

Я бы специально записал это как архитектурное правило.

Не делать:

Project {
    gameObjects: GameObject[]
        pages: Page[]
            blocks: Block[]
                ...
}

потому что один Project потенциально может содержать десятки тысяч сущностей.

Вместо этого:

Project
   │
   ├── gameObjectIds
   ├── templateIds
   └── assetIds

GameObject
   │
   └── pageIds

Page
   │
   └── blockIds

а сами данные лежат в repository/storage.

Это сохраняет нашу первоначальную идею Dictionary<Guid, Entity>.


---

22. Перенос между Project должен быть отдельной domain operation

Я бы не разрешал UI вручную делать:

copy object
copy assets
change projectId

Это должен быть отдельный сервис:

ProjectTransferService

с операциями вроде:

copyAsset(...)
copyTemplate(...)
copyGameObject(...)
cloneProject(...)

Потому что именно этот слой должен заниматься:

GUID remapping
dependency resolution
reference remapping
asset copying
project ownership

UI только говорит:

Copy Template X
from Project A
to Project B

а domain/application layer выполняет операцию.


---

23. Это прекрасно ложится на наши слои

Теперь архитектура становится такой:

Presentation
────────────────────────
Web UI
PWA
Tiptap
Project Manager
Inspector
Block Editor


Application
────────────────────────
CreateProject
CloneProject
DeleteProject
CopyTemplate
CopyAsset
CopyGameObject
ImportProject
ExportProject
Search
...


Domain
────────────────────────
Project
GameObject
Page
Block
Asset
Template
Tag
Reference
...


Infrastructure
────────────────────────
SQLite
File Storage
Asset Storage
Repositories
Serialization
...


SaaS Infrastructure
────────────────────────
Cloud DB
Object Storage
Auth
Billing
Collaboration
Backups

Это, на мой взгляд, уже очень хорошая архитектурная граница.


---

24. Template system теперь тоже становится понятнее

У нас есть два уровня Template.

GameObject Template:

Project
└── Template
    └── GameObject blueprint
        ├── Pages
        ├── Blocks
        ├── metadata
        └── assets/references

и Page Template:

Project
└── Template
    └── Page blueprint
        └── Blocks

А затем:

Create GameObject
      ↓
Choose Template
      ↓
Character Template
      ↓
New GameObject

или:

Create Page
      ↓
Choose Template
      ↓
Character Overview
      ↓
New Page

Templates принадлежат Project, но могут быть экспортированы/скопированы в другой Project.


---

25. И я бы добавил Project Templates в будущее

Не путать с обычными GameObject/Page Templates.

Позже пользователь сможет сделать:

> Create Project from Template



Например:

New Project
│
├── Blank Project
├── Fantasy World
├── D&D Campaign
├── Sci-Fi Universe
├── Cyberpunk
└── Novel

Fantasy World в таком случае является фактически Project Template/Example Project.

Но на MVP достаточно механизма:

Example Project
      ↓
Clone
      ↓
User Project


---

26. User Stories для Project

Я бы добавил в ТЗ следующие обязательные истории.

Создание:

> Как пользователь, я хочу создать новый Project, чтобы начать отдельный мир.



> Как пользователь, я хочу задать название, описание и banner Project, чтобы визуально различать свои миры.



Навигация:

> Как пользователь, я хочу видеть список своих Projects, чтобы быстро переключаться между мирами.



> Как пользователь, я хочу открыть Project и увидеть его GameObjects, Assets и Templates.



Клонирование:
> Как пользователь, я хочу клонировать Project, чтобы создать независимую копию мира для экспериментов или новой кампании.



> При клонировании все внутренние GUID должны быть переназначены, а внутренние ссылки должны продолжать работать.



Examples:

> Как новый пользователь, я хочу открыть готовый read-only Example Project, чтобы понять, как пользоваться системой.



> Я хочу клонировать Example Project и превратить его в свой редактируемый Project.



Перенос:

> Я хочу перенести Template из одного Project в другой.



> Я хочу перенести Asset из одного Project в другой.



> В будущем я хочу переносить GameObject вместе со всеми необходимыми зависимостями.



Управление:

> Я хочу переименовать Project.



> Я хочу изменить его описание.



> Я хочу изменить banner.



> Я хочу экспортировать Project.



> Я хочу импортировать Project.



> Я хочу удалить Project после подтверждения.