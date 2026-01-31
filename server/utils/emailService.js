const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error) => {
    if (error) {
      console.log('[EMAIL] ⚠️  Credentials invalid - will retry when fixed');
    } else {
      console.log('[EMAIL] ✅ SMTP verified - ready to send');
    }
  });
}

const getEmailTemplate = (daysLeft, subscription) => {
  const expiryDate = new Date(subscription.endDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const templates = {
    7: {
      subject: `⏰ ${subscription.serviceName} expires in 7 days`,
      color: '#1976d2',
      icon: '⏰',
      title: 'Subscription Renewal Reminder',
      message: `Your subscription expires in <strong>7 days</strong>`
    },
    3: {
      subject: `⏰ ${subscription.serviceName} expires in 3 days`,
      color: '#ff9800',
      icon: '⚠️',
      title: 'Urgent: 3 Days Until Expiry',
      message: `Your subscription expires in <strong>3 days</strong>`
    },
    2: {
      subject: `⚠️ ${subscription.serviceName} expires in 2 days`,
      color: '#f57c00',
      icon: '⚠️',
      title: 'Critical: 2 Days Until Expiry',
      message: `Your subscription expires in <strong>2 days</strong>`
    },
    1: {
      subject: `🚨 ${subscription.serviceName} expires TOMORROW`,
      color: '#d32f2f',
      icon: '🚨',
      title: 'URGENT: Expires Tomorrow!',
      message: `Your subscription expires <strong>TOMORROW</strong>`
    },
    0: {
      subject: `❌ ${subscription.serviceName} expired today`,
      color: '#c62828',
      icon: '❌',
      title: 'Subscription Expired',
      message: `Your subscription <strong>expired today</strong>`
    },
    '-1': {
      subject: `❌ ${subscription.serviceName} is overdue`,
      color: '#b71c1c',
      icon: '❌',
      title: 'Subscription Overdue',
      message: `Your subscription <strong>expired yesterday</strong>`
    }
  };

  const template = templates[daysLeft] || templates['-1'];

  return {
    subject: template.subject,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: ${template.color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${template.icon} ${template.title}</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">${template.message}</p>
          
          <div style="background-color: white; border-left: 4px solid ${template.color}; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 8px 0;"><strong>Service:</strong> ${subscription.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Amount:</strong> ₹${subscription.amount}</p>
            <p style="margin: 8px 0;"><strong>Expiry Date:</strong> ${expiryDate}</p>
            <p style="margin: 8px 0;"><strong>Category:</strong> ${subscription.category}</p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            ${daysLeft > 0 ? 'Please renew your subscription before it expires.' : 'Renew now to restore service.'}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 11px; color: #999; text-align: center; margin: 0;">
            Bill Reminder • Automated Subscription Management
          </p>
        </div>
      </div>
    `
  };
};

const sendReminder = async (subscription, daysLeft, userEmail) => {
  try {
    // Use provided user email (login email), not subscription email
    const recipientEmail = userEmail || subscription.email;

    if (!recipientEmail) {
      console.log(`[EMAIL] SKIP | ${subscription._id} | missing_email`);
      return { success: false };
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`[EMAIL] SKIP | ${subscription._id} | no_credentials`);
      return { success: false };
    }

    const template = getEmailTemplate(daysLeft, subscription);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] SENT | ${subscription._id} | days=${daysLeft} | ${subscription.serviceName} | to=${recipientEmail}`);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.log(`[EMAIL] FAIL | ${subscription._id} | ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendReminder,
  transporter
};
