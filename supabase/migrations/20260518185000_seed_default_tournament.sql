do $$
declare
  v_count integer;
  v_month text;
  v_name text;
  v_id text;
begin
  select count(*) into v_count from public.tournaments;
  if v_count > 0 then
    return;
  end if;

  v_month := case extract(month from now())::int
    when 1 then 'gennaio'
    when 2 then 'febbraio'
    when 3 then 'marzo'
    when 4 then 'aprile'
    when 5 then 'maggio'
    when 6 then 'giugno'
    when 7 then 'luglio'
    when 8 then 'agosto'
    when 9 then 'settembre'
    when 10 then 'ottobre'
    when 11 then 'novembre'
    else 'dicembre'
  end;

  v_name := 'Torneo ' || extract(day from now())::int || ' ' || v_month;
  v_id := replace(gen_random_uuid()::text, '-', '');

  insert into public.tournaments (id, name, team_count)
  values (v_id, v_name, 4);
end $$;
