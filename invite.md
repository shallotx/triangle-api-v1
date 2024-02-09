## How to invite user

- create an invite and store to db
- CREATE TABLE `user_invite` (                                                  
`email` text PRIMARY KEY NOT NULL,                                            
`token` text NOT NULL,                                                        
`expires` integer NOT NULL,                                                   
`is_active` integer NOT NULL, user_confirmed INTEGER NOT NULL DEFAULT 0);  