-- SAT bank: "Command of Evidence" split into Textual and Quantitative (as on the
-- College Board's skill reports). Quantitative = the question comes with a graph
-- or table; the three questions whose whole prompt is an image were checked by eye.
update public.sat_questions
  set skill = case
    when content::text like '%"img"%' or content::text like '%"fig"%' or content::text ilike '%[table]%'
      or id in ('e441da80', '24c1b7e4', 'cca6fae9')
    then 'Command of Evidence: Quantitative'
    else 'Command of Evidence: Textual' end,
  updated_at = now()
where skill = 'Command of Evidence';
