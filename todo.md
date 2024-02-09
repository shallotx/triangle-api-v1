
- need to verify data betwen Turso and Neon

  - **members**
  - **virtual_meetings** verified 12/17/2023
  - **meeting_types** verified 12/17/2023
  - **discussion_type** verified 12/17/2023
  - **donation_code** verified 12/17/2023
  - **links** verified 12/19/2023
  - **products** verified 12/28/2023
  - **meetings** verified 12/26/2023

- **for converting from turso to postgres**

  1.  export members from turso (use turso dashboard) to .csv - place on desktop
  2.  delete created_at, updated_at, and columns
  3.  truncate (reset identity) members in postgres
  4.  import members.csv (exclude columns notes, created_at, updated_at, salt, search_vector)
  5.  ~~\copy members_turso FROM '/home/shallotx/Desktop/members.csv' DELIMITER ',' CSV HEADER~~
  6.  do other stuff

 
