create schema covidauto;
create user covidauto@localhost;
grant all privileges on covidauto.* to covidauto@localhost;
use covidauto;

create table userdata
(
	school varchar(15) not null,
	name varchar(5) not null,
	birth varchar(6) not null,
	url varchar(50) not null
);
