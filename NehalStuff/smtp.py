import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

username = 'NehalNN10'
password = 'DigitalTwin26'
msg = MIMEMultipart('mixed')

sender = 'nh07884@st.habib.edu.pk'
recipient = 'nehalnaeem13@gmail.com'

msg['Subject'] = 'Test Email'
msg['From'] = sender
msg['To'] = recipient

text_message = MIMEText('It is a text message.', 'plain')
html_message = MIMEText('It is a html message.', 'html')
msg.attach(text_message)
msg.attach(html_message)

mailServer = smtplib.SMTP('mail.smtp2go.com', 2525) #  8025, 587 and 25 can also be used. 
mailServer.ehlo()
mailServer.starttls()
mailServer.ehlo()
mailServer.login(username, password)
mailServer.sendmail(sender, recipient, msg.as_string())
mailServer.close()