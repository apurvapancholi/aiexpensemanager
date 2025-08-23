# Expense Tracker Pro

## Overview

Expense Tracker Pro is a comprehensive AI-powered personal finance management application built with React, Express, and TypeScript. The application provides intelligent expense tracking through receipt OCR processing, automated categorization, budget management, and personalized financial insights via an integrated AI assistant. Users can upload receipts which are automatically processed to extract expense data, track spending patterns, set budget goals with smart alerts, and receive actionable financial guidance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**Frontend Architecture**
- Single Page Application (SPA) built with React 18 and TypeScript
- Modern UI components using shadcn/ui component library with Radix UI primitives
- Styling with Tailwind CSS featuring custom design system with CSS variables
- Client-side routing implemented with Wouter for lightweight navigation
- State management through TanStack Query (React Query) for server state synchronization
- Form handling with React Hook Form and Zod validation schemas

**Backend Architecture**
- RESTful API server built with Express.js and TypeScript in ESM format
- Layered architecture with clear separation: routes, services, and data access layers
- Middleware-driven request processing with comprehensive logging and error handling
- Session-based authentication using express-session with PostgreSQL session storage
- File upload capabilities with multer and image processing via sharp

**Database Design**
- PostgreSQL database with Drizzle ORM for type-safe database operations
- Comprehensive schema covering users, expense categories, receipts, expenses, budget goals, chat conversations, and sessions
- UUID primary keys for enhanced security and distributed system compatibility
- Temporal data tracking with created/updated timestamps across entities

**Authentication & Authorization**
- OAuth 2.0 integration with Replit's OpenID Connect provider
- Passport.js strategy for standardized authentication flow
- Session-based user state management with secure cookie configuration
- Protected route middleware ensuring authenticated access to sensitive operations

**File Storage & Processing**
- Google Cloud Storage integration for secure object storage with ACL policies
- Receipt image upload with direct-to-cloud streaming via presigned URLs
- Custom object access control system supporting granular permission management
- Image optimization and processing pipeline for receipt OCR preparation

**AI & Machine Learning Integration**
- OpenAI GPT-4o integration for advanced receipt OCR and data extraction
- Intelligent expense categorization using machine learning classification
- Conversational AI assistant for personalized financial insights and recommendations
- Smart budget analysis and predictive spending pattern recognition

**Real-time Features**
- Email notification system for budget alerts and threshold warnings
- Automated expense categorization with confidence scoring
- Dynamic dashboard updates with real-time spending analytics
- Progressive web app capabilities for mobile-first user experience

**Development & Deployment**
- Vite-powered development environment with hot module replacement
- TypeScript throughout the stack for enhanced developer experience and type safety
- ESBuild for optimized production builds and fast compilation
- Replit-native deployment with integrated development tools and debugging

## External Dependencies

**Core Framework Dependencies**
- React 18 ecosystem with modern hooks and concurrent features
- Express.js web framework with comprehensive middleware ecosystem
- TypeScript for full-stack type safety and enhanced developer productivity

**Database & ORM**
- PostgreSQL via Neon Database serverless platform for scalable data storage
- Drizzle ORM with PostgreSQL adapter for type-safe database operations and migrations
- Database schema versioning and migration management through drizzle-kit

**Authentication Services**
- Replit OpenID Connect provider for secure user authentication
- Passport.js authentication middleware with session management
- Express-session with PostgreSQL session store for persistent login state

**Cloud Services**
- Google Cloud Storage for scalable object storage and file management
- OpenAI API (GPT-4o) for advanced natural language processing and computer vision
- SMTP email service integration for automated notifications and alerts

**UI & Styling Framework**
- Tailwind CSS utility-first framework with custom design system
- shadcn/ui component library built on Radix UI primitives
- Lucide React for consistent iconography and visual elements

**File Upload & Processing**
- Uppy file upload library with Google Cloud Storage adapter
- Multer middleware for multipart form data handling
- Sharp image processing library for receipt optimization and transformation

**Development Tools**
- Vite build tool with React plugin for fast development and optimized builds
- ESBuild for production bundling and TypeScript compilation
- Replit-specific plugins for enhanced development experience and debugging