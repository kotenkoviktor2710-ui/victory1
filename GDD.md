# MERGE_PLAYTIME_GDD.md

# Merge Playtime

## Genre

Hybrid:

- Clicker
- Merge
- Idle
- Async PvP Auto Battler
- Collection

Target Platform:

- Yandex Games
- Web
- Mobile Web

---

# High Concept

Игрок кликает по игрушке и зарабатывает монеты.

Монеты используются для покупки новых игрушек.

Одинаковые игрушки объединяются (Merge) и становятся сильнее.

Игрушки участвуют в асинхронных PvP-боях против других игроков.

Основная цель игрока:

- собирать коллекцию игрушек;
- открывать новые уровни игрушек;
- усиливать команду;
- подниматься в рейтинге PvP.

---

# Core Loop

1. Клик по игрушке
2. Получение монет
3. Покупка игрушек
4. Merge одинаковых игрушек
5. Усиление команды
6. PvP бой
7. Получение наград
8. Развитие коллекции
9. Повтор цикла

---

# Gameplay Systems

## Clicker System

Игрок постоянно кликает по центральной игрушке.

Каждая игрушка имеет собственную награду за клик.

### Formula

CoinsReward = BaseReward × Multiplier

### Example

Huggy Lv1

Reward = 10

Multiplier x1 = 10

Multiplier x5 = 50

---

# Combo Multiplier

Сверху экрана располагается шкала серии кликов.

Каждый клик заполняет шкалу.

### Levels

x1

x2

x3

x4

x5

После достижения следующего порога увеличивается множитель награды.

При отсутствии кликов множитель постепенно снижается.

---

# Board System

Стартовый размер поля:

4x4

16 слотов

Позже открываются:

5x5

25 слотов

6x6

36 слотов

Игрок размещает игрушки на поле вручную.

---

# Toy System

Каждая игрушка имеет характеристики.

```typescript
interface Toy {
  id: string
  name: string

  level: number

  rarity: Rarity

  attack: number
  health: number
  speed: number

  critChance: number
  critDamage: number

  clickReward: number
  passiveIncome: number

  buyCost: number
}
```

---

# Toy Levels

Минимальный уровень:

Level 1

Максимальный уровень:

Level 20

---

# Merge System

Для объединения требуются две одинаковые игрушки одного уровня.

### Formula

Lv1 + Lv1 = Lv2

Lv2 + Lv2 = Lv3

Lv3 + Lv3 = Lv4

...

Lv19 + Lv19 = Lv20

---

# Toy Collection

Планируемое количество:

60+ игрушек

Рекомендуемое количество для релиза:

50

---

# Rarity

Common

Rare

Epic

Legendary

Mythic

Ancient

---

# Economy

## Coins

Основная валюта.

Получение:

- клики
- пассивный доход
- победы PvP
- задания

---

## Premium Currency

Gems

Получение:

- достижения
- рейтинг
- донат
- события

---

# Passive Income

Каждая игрушка на поле генерирует доход.

### Example

Huggy Lv1

+5 coins/sec

CatNap Lv3

+75 coins/sec

---

# Toy Purchase System

Стоимость покупки растет после каждой покупки.

### Formula

Cost = BaseCost × 1.15^Purchases

---

# PvP System

Тип:

Asynchronous PvP

Игроки не находятся онлайн одновременно.

Сервер сохраняет состав команды.

Другие игроки могут атаковать этот состав.

---

# Team Composition

Максимум:

5 игрушек

Игрок выбирает:

- танков
- дамагеров
- саппортов

---

# Combat Stats

Каждая игрушка имеет:

Attack

Health

Speed

Critical Chance

Critical Damage

---

# Initiative System

Порядок ходов определяется скоростью.

Пример:

CatNap Speed = 15

Huggy Speed = 10

CatNap атакует первым.

---

# Damage Formula

Damage = Attack

TargetHealth -= Damage

---

# Critical Formula

If Random < CritChance

Damage × CritDamage

---

# Skills

Навыки открываются после определенного уровня.

Обычно:

Level 10

Level 15

Level 20

---

# Example Skills

## Huggy

Bite

150% damage

---

## Mommy

Heal Ally

Восстанавливает здоровье союзнику.

---

## CatNap

Poison

Накладывает постепенный урон.

---

## Prototype

Chain Lightning

Бьет нескольких противников.

---

# Matchmaking

Подбор по силе команды.

### Team Power Formula

Power = Σ(Attack + Health)

Допуск:

±20%

---

# Battle Rewards

За победу:

- Coins
- Parts
- Gems
- Chests

---

# Chests

Types:

Common

Rare

Epic

Legendary

Mythic

---

# Chest Rewards

- Toys
- Coins
- Gems
- Boosters

---

# Ranking

Bronze

Silver

Gold

Platinum

Diamond

Master

Legend

---

# Rating Gain

Victory

+25

Defeat

-10

---

# Quests

## Daily

Сделать 10 Merge

Сделать 1000 кликов

Выиграть 5 боев

Открыть 3 сундука

---

## Weekly

Сделать 100 Merge

Победить 50 игроков

Получить Mythic игрушку

---

# Prestige System

Открывается после достижения крупной суммы монет.

Пример:

10B Coins

Игрок сбрасывает прогресс.

Получает:

Soul Fragments

---

# Prestige Bonuses

- Click Income

- Passive Income

- PvP Damage

- Chest Luck

---

# Research Tree

## Economy

Click Power

Passive Income

Coin Boost

---

## Combat

Attack Boost

Health Boost

Critical Chance

---

## Merge

Merge Efficiency

Double Merge Chance

Merge Discount

---

## PvP

Rating Bonus

Chest Chance

Loot Bonus

---

# Retention Features

Daily Rewards

Daily Chest

Lucky Wheel

Achievements

Collection Progress

Ranking Seasons

Events

Limited Toys

---

# Tech Stack

Frontend

Vue 3

TypeScript

Phaser 3

Pinia

Vue Router

---

Backend

Node.js

NestJS

PostgreSQL

Redis

Socket.IO

---

Cloud

Yandex Cloud

или

Cloudflare + Supabase

---

# MVP Scope

Release Version:

- Clicker
- Merge
- 20 Toys
- Async PvP
- Chests
- Rating
- Daily Quests

После проверки метрик:

- 50+ Toys
- Skills
- Prestige
- Events
- Seasons
- Guilds
- Tournaments
