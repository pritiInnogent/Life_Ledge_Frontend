###### **19/11/2025**

update this for 100 transactions



1)hybrid categorization using Gemini API key(uses gamma model)(merchant name, account no, date) ---- done

which model is API key using ? for testing we are using Gemini 2.5 flash model 



2)automated recurring data -done 

3\) Behavioral recurring data - done

4)ai generate insights summarize for the above data - done 

###### 

###### **20/11/2025**

**t- implemented jwt,singin,login,multiuser mapping,upload profile pic option using cloudnary**

1)created the API calling branch and push the logic for AI insights, recurring data, and anomalies detection.

2)read data from pdf and check it generates the data in json format or not.

To do this- 

a)file controller-add new endpoint(/file/upload-pdf) upload pdf and return field, /file/extract-pdf-accept field + password then extract data

b) service layer - update file interface, implement in file  service implementation.

c)utility layer- we will use pdf parser util to support password protected pdfs.



now Implementation -first added dependency->then updated pdf parser util ->fileservice.java -> file service implementation ->



3\) now we have extracted raw data, we'll apply rules on these data:



**Feedback - why you are using different endpoints for each method? also why are you converting in pdf-txt-json for hiding purpose only? there would be a new way to implement it?** 

todo

Global exception handling (create a package exception and create custom exception and add all those exceptions in one global exception folder)

&nbsp;

**21/11/2025**

goal entity and its api's(category or bankaccount refrence jwt validation)

recurring entity and its api

insights entity and its basic api















