create table if not exists dogs (
  id serial primary key,
  user_id text not null,
  name text not null,
  current_weight_kg numeric(6, 2) not null,
  ideal_weight_kg numeric(6, 2) not null,
  life_stage text not null default 'adult',
  activity text not null default 'moderate',
  neutered boolean not null default true,
  goal text not null default 'maintain',
  meals_per_day integer not null default 2,
  treat_pct numeric(4, 1) not null default 10,
  target_kcal integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dogs_user_id_idx on dogs (user_id);

create table if not exists foods (
  id serial primary key,
  user_id text not null,
  name text not null,
  kind text not null default 'meal',
  kcal numeric(8, 2) not null,
  unit text not null default '100g',
  created_at timestamptz not null default now()
);
create index if not exists foods_user_id_idx on foods (user_id);

create table if not exists log_entries (
  id serial primary key,
  user_id text not null,
  dog_id integer not null references dogs (id) on delete cascade,
  log_date date not null,
  name text not null,
  kind text not null default 'meal',
  kcal numeric(8, 2) not null,
  amount numeric(8, 2),
  unit text,
  food_id integer references foods (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists log_entries_user_dog_date_idx
  on log_entries (user_id, dog_id, log_date);
