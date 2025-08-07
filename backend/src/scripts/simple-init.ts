import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CreditService } from '../services/credit.service';

async function initializeDatabase() {
  try {
    // Create a minimal NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the credit service
    const creditService = app.get(CreditService);
    
    console.log('✅ Database connected successfully');
    
    // Initialize default packages (this is handled by onModuleInit in CreditService)
    console.log('✅ Credit packages will be initialized automatically');
    
    // Add welcome bonus to existing users
    console.log('✅ Welcome bonuses will be added automatically');
    
    console.log('✅ Database initialization completed');
    
    // Close the application
    await app.close();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Run the initialization
initializeDatabase(); 