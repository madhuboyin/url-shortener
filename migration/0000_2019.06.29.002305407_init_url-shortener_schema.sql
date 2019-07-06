create table "short_urls" (
  id serial,
  full_url varchar(255) not null,
  short_url varchar(255) not null unique,
  hits int not null,
  created_at timestamp not null,
  expired_at timestamp not null,
  primary key (id)
);