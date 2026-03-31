// Seed default email templates
// Run: node scripts/seedEmailTemplates.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import EmailTemplate from '../models/EmailTemplate.js'

dotenv.config()

const defaultTemplates = [
  {
    name: 'OTP - Signup',
    slug: 'otp-signup',
    subject: 'Your Verification Code - {{app_name}}',
    category: 'authentication',
    isSystem: true,
    description: 'OTP email sent during user signup',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Verify Your Email</h2>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Use the following OTP to complete your registration. This code is valid for <strong>{{expiry_minutes}} minutes</strong>.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #f97316;">{{otp}}</span>
              </div>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: 'OTP - Password Reset',
    slug: 'otp-password_reset',
    subject: 'Password Reset OTP - {{app_name}}',
    category: 'authentication',
    isSystem: true,
    description: 'OTP email sent for password reset',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Password Reset</h2>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Use the following OTP to reset your password. This code is valid for <strong>{{expiry_minutes}} minutes</strong>.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #f97316;">{{otp}}</span>
              </div>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: 'Welcome Email',
    slug: 'welcome',
    subject: 'Welcome to {{app_name}}! 🎉',
    category: 'transactional',
    isSystem: true,
    description: 'Welcome email sent after successful registration',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email address', example: 'john@example.com' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <!--$--><!--html--><!--head-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Trade with 0.0 spreads and zero commission today.
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
      </div>
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="font-weight:600">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        data-id="__react-email-column"
                                        style="margin:0;padding:0">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-weight:600">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:100%">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr
                                                              style="margin:0;padding:0">
                                                              <td
                                                                data-id="__react-email-column"
                                                                style="margin:0;padding:0">
                                                                <table
                                                                  width="100%"
                                                                  border="0"
                                                                  cellpadding="0"
                                                                  cellspacing="0"
                                                                  role="presentation"
                                                                  style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <p
                                                                              style="margin:0;padding:0">
                                                                              <br />
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            align="center"
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <table
                                                                              width="600"
                                                                              border="0"
                                                                              cellpadding="0"
                                                                              cellspacing="0"
                                                                              role="presentation"
                                                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:3px;border-color:#1f2f5a;border-radius:10px;overflow:hidden">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:0">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:10px 20px;text-align:center">
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                                                                          <br />
                                                                                        </p>
                                                                                        <table
                                                                                          align="center"
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0;width:100%">
                                                                                                  <td
                                                                                                    align="left"
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <img
                                                                                                      alt="The HC Finvest logo features a dark blue abstract &#x27;H&#x27; shape next to the company name in a dark blue script font."
                                                                                                      height="120"
                                                                                                      src="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee"
                                                                                                      style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black"
                                                                                                      width="600" />
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <h2
                                                                                          style="margin:0;padding:0;color:#1f2f5a">
                                                                                          Welcome
                                                                                          to
                                                                                          HC
                                                                                          Finvest
                                                                                        </h2>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;color:#333;font-size:14px;line-height:1.6">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Congratulations,
                                                                                          <strong
                                                                                            >Nilesh
                                                                                            Rathod</strong
                                                                                          >
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Thank
                                                                                          you
                                                                                          for
                                                                                          registering
                                                                                          with
                                                                                          our
                                                                                          application.
                                                                                          We&#x27;re
                                                                                          thrilled
                                                                                          to
                                                                                          have
                                                                                          you
                                                                                          on
                                                                                          board.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Login
                                                                                            Credentials:</strong
                                                                                          >
                                                                                        </p>
                                                                                        <table
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:20px;margin-right:0;margin-bottom:20px;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;border-style:solid;border-width:1px;border-color:#ddd;border-radius:6px;background:#f9fafc">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0">
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      <br />
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0">
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      <strong
                                                                                                        >Full
                                                                                                        Name
                                                                                                        :</strong
                                                                                                      >
                                                                                                    </p>
                                                                                                  </td>
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      Nilesh
                                                                                                      Rathod
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0">
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      <strong
                                                                                                        >Email
                                                                                                        :</strong
                                                                                                      >
                                                                                                    </p>
                                                                                                  </td>
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      Nilesh@email.com
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0">
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      <strong
                                                                                                        >Password
                                                                                                        :</strong
                                                                                                      >
                                                                                                    </p>
                                                                                                  </td>
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      123456789
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <div
                                                                                          style="margin:30px 0;padding:0;text-align:center">
                                                                                          <p
                                                                                            style="margin:0;padding:0">
                                                                                            <span
                                                                                              style="color:#ffffff;text-decoration-line:none;background:#1f2f5a;padding:12px 28px;text-decoration:none;border-radius:25px;display:inline-block;font-size:14px"
                                                                                              ><a
                                                                                                href="https://trade.hcfinvest.com/user/login"
                                                                                                rel="noopener noreferrer nofollow"
                                                                                                style="color:#067df7;text-decoration-line:none"
                                                                                                target="_blank"
                                                                                                >Log
                                                                                                In
                                                                                                to
                                                                                                Your
                                                                                                Account</a
                                                                                              ></span
                                                                                            >
                                                                                          </p>
                                                                                        </div>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          If
                                                                                          you
                                                                                          need
                                                                                          any
                                                                                          assistance,
                                                                                          our
                                                                                          24/5
                                                                                          support
                                                                                          team
                                                                                          is
                                                                                          always
                                                                                          here
                                                                                          to
                                                                                          help.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Regards,<br /><strong
                                                                                            >HC
                                                                                            Finvest
                                                                                            (Heddge
                                                                                            Capitals
                                                                                            Wealth
                                                                                            Management
                                                                                            LLC)</strong
                                                                                          ><br />support@heddgecapitals.com<br />www.hcfinvest.com
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:20px">
                                                                                          <strong
                                                                                            >Note:</strong
                                                                                          >
                                                                                          For
                                                                                          your
                                                                                          security,
                                                                                          please
                                                                                          change
                                                                                          your
                                                                                          password
                                                                                          after
                                                                                          your
                                                                                          first
                                                                                          login.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Risk
                                                                                            warning:</strong
                                                                                          >
                                                                                          Forex
                                                                                          and
                                                                                          CFD
                                                                                          trading
                                                                                          carry
                                                                                          a
                                                                                          high
                                                                                          level
                                                                                          of
                                                                                          risk
                                                                                          and
                                                                                          may
                                                                                          not
                                                                                          be
                                                                                          suitable
                                                                                          for
                                                                                          all
                                                                                          investors.
                                                                                          These
                                                                                          instruments
                                                                                          are
                                                                                          complex
                                                                                          and
                                                                                          involve
                                                                                          the
                                                                                          use
                                                                                          of
                                                                                          leverage,
                                                                                          which
                                                                                          can
                                                                                          amplify
                                                                                          both
                                                                                          gains
                                                                                          and
                                                                                          losses.
                                                                                          Before
                                                                                          engaging
                                                                                          in
                                                                                          trading,
                                                                                          you
                                                                                          should
                                                                                          carefully
                                                                                          consider
                                                                                          your
                                                                                          investment
                                                                                          objectives,
                                                                                          level
                                                                                          of
                                                                                          experience,
                                                                                          and
                                                                                          risk
                                                                                          appetite.
                                                                                          There
                                                                                          is
                                                                                          a
                                                                                          possibility
                                                                                          that
                                                                                          you
                                                                                          could
                                                                                          sustain
                                                                                          a
                                                                                          loss
                                                                                          of
                                                                                          some
                                                                                          or
                                                                                          all
                                                                                          of
                                                                                          your
                                                                                          invested
                                                                                          capital,
                                                                                          and
                                                                                          therefore
                                                                                          you
                                                                                          should
                                                                                          not
                                                                                          invest
                                                                                          money
                                                                                          that
                                                                                          you
                                                                                          cannot
                                                                                          afford
                                                                                          to
                                                                                          lose.
                                                                                          You
                                                                                          are
                                                                                          strongly
                                                                                          advised
                                                                                          to
                                                                                          seek
                                                                                          independent
                                                                                          financial
                                                                                          advice
                                                                                          before
                                                                                          making
                                                                                          any
                                                                                          trading
                                                                                          decisions.
                                                                                          HC
                                                                                          Finvest
                                                                                          (Heddge
                                                                                          Capitals)
                                                                                          does
                                                                                          not
                                                                                          guarantee
                                                                                          any
                                                                                          profits
                                                                                          and
                                                                                          is
                                                                                          not
                                                                                          liable
                                                                                          for
                                                                                          any
                                                                                          losses
                                                                                          incurred.
                                                                                          Trading
                                                                                          should
                                                                                          only
                                                                                          be
                                                                                          undertaken
                                                                                          by
                                                                                          individuals
                                                                                          who
                                                                                          fully
                                                                                          understand
                                                                                          the
                                                                                          risks
                                                                                          involved.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          ©
                                                                                          2026
                                                                                          Heddge
                                                                                          Capitals
                                                                                          Wealth
                                                                                          Management
                                                                                          LLC.<br />All
                                                                                          rights
                                                                                          reserved.<br /><span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/privacyPolicies"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >Privacy
                                                                                              Policy</a
                                                                                            ></span
                                                                                          >
                                                                                          |
                                                                                          <span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >hcfinvest.com</a
                                                                                            ></span
                                                                                          >
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                                <p
                                                                  style="margin:0;padding:0">
                                                                  <br />
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="margin:0;padding:0"><br /></p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
`
  },
  {
    name: 'Password Reset Link',
    slug: 'password-reset',
    subject: 'Reset Your Password - {{app_name}}',
    category: 'authentication',
    isSystem: true,
    description: 'Password reset link email',
    placeholders: [
      { key: 'reset_url', description: 'Password reset URL', example: 'https://example.com/reset?token=xxx' },
      { key: 'expiry_minutes', description: 'Link expiry time in minutes', example: '60' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                This link will expire in <strong>{{expiry_minutes}} minutes</strong>.
              </p>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: 'Deposit Confirmation',
    slug: 'deposit-confirmation',
    subject: 'Deposit Confirmed - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a deposit is confirmed',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'amount', description: 'Deposit amount', example: '$1,000' },
      { key: 'transaction_id', description: 'Transaction ID', example: 'TXN123456' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Deposit Confirmed ✓</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Hi {{user_name}}, your deposit has been successfully processed.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px;">Amount:</td>
                    <td style="padding: 10px 0; color: #22c55e; font-size: 18px; font-weight: 600; text-align: right;">{{amount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px; border-top: 1px solid #eee;">Transaction ID:</td>
                    <td style="padding: 10px 0; color: #333333; font-size: 14px; text-align: right; border-top: 1px solid #eee;">{{transaction_id}}</td>
                  </tr>
                </table>
              </div>
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                The funds are now available in your wallet.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: 'Withdrawal Confirmation',
    slug: 'withdrawal-confirmation',
    subject: 'Withdrawal Processed - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a withdrawal is processed',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'amount', description: 'Withdrawal amount', example: '$500' },
      { key: 'transaction_id', description: 'Transaction ID', example: 'TXN123456' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Withdrawal Processed</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Hi {{user_name}}, your withdrawal request has been processed.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px;">Amount:</td>
                    <td style="padding: 10px 0; color: #f97316; font-size: 18px; font-weight: 600; text-align: right;">{{amount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666666; font-size: 14px; border-top: 1px solid #eee;">Transaction ID:</td>
                    <td style="padding: 10px 0; color: #333333; font-size: 14px; text-align: right; border-top: 1px solid #eee;">{{transaction_id}}</td>
                  </tr>
                </table>
              </div>
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                The funds will be credited to your bank account within 1-3 business days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {

  }
]

async function seedTemplates() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcf'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    for (const template of defaultTemplates) {
      const existing = await EmailTemplate.findOne({ slug: template.slug })
      if (existing) {
        console.log(`Template already exists: ${template.slug}`)
        continue
      }

      await EmailTemplate.create(template)
      console.log(`Created template: ${template.slug}`)
    }

    console.log('\n✅ Email templates seeded successfully!')
    await mongoose.disconnect()
    process.exit(0)

  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

seedTemplates()
