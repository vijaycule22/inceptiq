# 💳 InceptIQ Credit System

## Overview

The Pay-As-You-Go monetization system allows users to purchase credits and consume them for various AI-powered features.

## 🎯 Credit Consumption Rates

| Action                          | Credits Required |
| ------------------------------- | ---------------- |
| PDF Upload + Summary            | 2 credits        |
| Flashcard Generation            | 1 credit         |
| Quiz Generation                 | 1 credit         |
| AI Chat Assistant (per session) | 2 credits        |
| Image Upload (OCR + Processing) | 2 credits        |
| Summary Generation              | 1 credit         |

## 💰 Credit Packages

| Package            | Credits | Price (₹) | Cost/Credit | Bonus Credits |
| ------------------ | ------- | --------- | ----------- | ------------- |
| Starter            | 10      | ₹99       | ₹9.90       | 0             |
| Explorer           | 30      | ₹249      | ₹8.30       | 5             |
| Pro                | 100     | ₹599      | ₹5.99       | 20            |
| Institutional Pack | 500     | ₹2499     | ₹4.99       | 100           |

## 🎁 Bonus System

- **Welcome Bonus**: New users receive 5 free credits
- **Referral Bonus**: 3 credits for new user, 2 credits for referrer
- **Package Bonuses**: Additional credits with larger packages

## 🏗️ Technical Implementation

### Backend Components

- **Entities**: `CreditTransaction`, `CreditPackage`, updated `User`
- **Service**: `CreditService` with consumption logic
- **Controller**: `CreditController` for API endpoints
- **Module**: `CreditModule` for organization

### Frontend Components

- **Service**: `CreditService` for API communication
- **Component**: `CreditsComponent` for package display
- **Integration**: Credit balance in topbar

## 🚀 Setup Instructions

1. **Initialize Database**:

   ```bash
   cd backend
   npm run init-db
   ```

2. **Start Backend**:

   ```bash
   npm run start:dev
   ```

3. **Start Frontend**:
   ```bash
   cd ../frontend
   npm start
   ```

## 📊 API Endpoints

### Credit Management

- `GET /api/credits/balance` - Get user credit balance
- `GET /api/credits/packages` - Get available packages
- `POST /api/credits/purchase` - Purchase credits
- `POST /api/credits/consume` - Consume credits for action

### Transaction History

- `GET /api/credits/transactions` - Get transaction history
- `GET /api/credits/usage-stats` - Get usage statistics

## 🔧 Database Schema

### CreditTransaction

- `id`: Primary key
- `userId`: User reference
- `transactionType`: 'purchase' | 'consumption' | 'bonus' | 'refund'
- `actionType`: Type of action that consumed credits
- `credits`: Number of credits (positive for earning, negative for spending)
- `amount`: Payment amount (for purchases)
- `description`: Transaction description

### CreditPackage

- `id`: Primary key
- `name`: Package name
- `credits`: Number of credits
- `price`: Package price
- `bonusCredits`: Additional bonus credits
- `isPopular`: Popular package flag

### User (Updated)

- `creditBalance`: Current credit balance
- `totalCreditsEarned`: Total credits earned
- `totalCreditsSpent`: Total credits spent

## 🎯 Usage Examples

### Consuming Credits

```typescript
// In TopicService
const hasCredits = await this.creditService.consumeCredits(
  userId,
  ActionType.PDF_UPLOAD,
  `PDF upload: ${filename}`
);

if (!hasCredits) {
  throw new Error("Insufficient credits");
}
```

### Adding Bonus Credits

```typescript
// For new users
await this.creditService.addWelcomeBonus(userId);

// For referrals
await this.creditService.addReferralBonus(newUserId, referrerId);
```

## 🔒 Security Features

- **JWT Authentication**: All credit endpoints protected
- **User Isolation**: Users can only access their own data
- **Transaction Logging**: Complete audit trail
- **Validation**: Input validation on all endpoints

## 📈 Monitoring

- **Real-time Balance**: Displayed in topbar
- **Transaction History**: Complete log of all activities
- **Usage Statistics**: Detailed analytics
- **Error Handling**: Graceful handling of insufficient credits

## 🚀 Future Enhancements

- **Payment Gateway Integration**: Real payment processing
- **Subscription Plans**: Monthly/yearly subscriptions
- **Credit Expiry**: Time-based credit expiration
- **Advanced Analytics**: Detailed usage reports
- **Referral System**: Complete referral tracking
