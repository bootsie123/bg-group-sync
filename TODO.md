# TODO

- Potentially refactor `blackbaudAuth.ts` to be a web based setup wizard (or use UI panel in Blackbaud app)
- Add CI/CD pipeline
- Add unit tests

Current Sprint:

- Make student Google Groups (students23@thecountryschoool.org) automatically be created with proper permissions and naming scheme
- Make "parents of" (parents23@thecountryschool.org) Google Groups automatically be created
- Use user information (roles) in Blackbaud to add users to groups
- Lookup student emails in "Students" OU for email address for Google Groups (update Blackbaud user with email address if one is found)

Next Sprint:

- Automatically create student Google accounts if they don't exist

Questions:

- When adding users to Google groups, the "Student" and "Parent" roles can be used. How should teachers/faculty be added to these groups?
