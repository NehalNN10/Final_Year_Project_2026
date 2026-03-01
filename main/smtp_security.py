import smtplib
import os
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

load_dotenv()

def send_emergency_alert(room_number, occupancy_count, recipient, description=None):
    # Credentials
    username = os.getenv("SMTP_USERNAME") 
    password = os.getenv("SMTP_PASSWORD")
    
    sender = 'nh07884@st.habib.edu.pk'
    
    # Generate current timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Use 'alternative' so the email client chooses HTML, but falls back to plain text if needed
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'🚨 EMERGENCY ALERT 🚨 Occupancy Detected in {room_number}'
    msg['From'] = sender
    msg['To'] = recipient

    # 1. Plain Text Fallback
    text_content = f"""
    Dear CSO,
    
    IMMEDIATE ACTION REQUIRED
    
    This is an automated emergency notification from the Digital Twin System.
    
    Room Number: {room_number}
    Current Occupancy: {occupancy_count}
    Timestamp: {timestamp}
    Details: {description if description else "No additional details provided."}
    
    Immediate action is required. Please verify the situation and take necessary measures.
    
    Regards,
    Habib University
    """

    # 2. HTML Content
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Emergency Occupancy Alert</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f4f7; font-family: Arial, Helvetica, sans-serif;">

      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background-color:#ffffff;">
        
        <tr>
          <td align="center" style="background-color:#40184a; padding:20px;">
            
            <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background-color:#ffffff;">
      
                <tr>
                    <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#bd1316; color:white; text-align:center; padding:15px; margin-bottom:20px;">
                        <tr>
                        <td style="font-size:18px; font-weight:bold; font-family: Arial, Helvetica, sans-serif;">
                            IMMEDIATE ACTION REQUIRED
                        </td>
                        </tr>
                    </table>
                    </td>
                </tr>

        <tr>
          <td style="padding:30px; color:#333333;">
            
            <p style="font-size:16px; margin-top:0;">
              Dear CSO,
            </p>

            <p style="font-size:15px; line-height:1.6;">
              This is an automated emergency notification from the Digital  Twin System.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" 
                   style="margin:20px 0; background-color:#f8f8fb; border-left:4px solid #bd1316;">
              <tr>
                <td style="padding:15px;">
                  <p style="margin:5px 0;"><strong>Room Number:</strong> {{room_number}}</p>
                  <p style="margin:5px 0;"><strong>Current Occupancy:</strong> {{occupancy}}</p>
                  <p style="margin:5px 0;"><strong>Timestamp:</strong> {{timestamp}}</p>
                  {% if description %}
                    <p style="margin:5px 0;"><strong>Details:</strong> {{description}}</p>
                  {% else %}
                    <p style="margin:5px 0;"><strong>Details:</strong> No additional details provided.</p>
                  {% endif %}
                </td>
              </tr>
            </table>

            <p style="font-size:15px; line-height:1.6;">
              Immediate action is required. Please verify the situation and take necessary measures.
            </p>

            <p style="font-size:15px;">
              Regards,<br>
              Habib University
            </p>

          </td>
        </tr>

        <tr>
          <td align="center" style="background-color:#eeeeee; padding:15px; font-size:12px; color:#666666;">
            This is an automated message. Please do not reply directly to this email.
          </td>
        </tr>

      </table>

    </body>
    </html>
    """

    # Inject variables into the HTML string
    html_content = html_content.replace('{{room_number}}', str(room_number))
    html_content = html_content.replace('{{occupancy}}', str(occupancy_count))
    html_content = html_content.replace('{{timestamp}}', str(timestamp))
    html_content = html_content.replace('{{description}}', str(description))

    # Attach both parts
    part1 = MIMEText(text_content, 'plain')
    part2 = MIMEText(html_content, 'html')

    msg.attach(part1)
    msg.attach(part2)

    # Validate credentials before sending the email
    if not username or not password:
      print("SMTP_USERNAME or SMTP_PASSWORD not set in environment; cannot send email.")
      print("Set these in your .env or environment variables and try again.")
      return

    # Send the email
    try:
        print("Connecting to SMTP server...")
        mailServer = smtplib.SMTP('mail.smtp2go.com', 2525)
        mailServer.ehlo()
        mailServer.starttls()
        mailServer.ehlo()
        mailServer.login(username, password)
        mailServer.sendmail(sender, recipient, msg.as_string())
        mailServer.close()
        print(f"Emergency alert sent successfully to {recipient}!")
    except Exception as e:
        print(f"Failed to send email: {e}")

# ==========================================
# TEST THE FUNCTION
# ==========================================
if __name__ == '__main__':
    send_emergency_alert(room_number="Projects Lab (C-007)", occupancy_count=5)