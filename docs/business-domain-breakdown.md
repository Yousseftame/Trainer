# Business Domain Breakdown — Admin Dashboard & Subscriber Dashboard

## 1. Overall Application Structure

The platform consists of three main user-facing areas:

1. **Public Website** — The public-facing website for presenting the trainer, services, subscription packages, and registration options.
2. **Admin Dashboard** — A centralized administrative interface used by the head trainer and authorized staff to manage the platform's operations.
3. **Subscriber Dashboard** — A private workspace where each subscriber accesses their assigned programs, subscription information, content, and progress records.

The Admin Dashboard is a single application area with role-based permissions. It is not a collection of completely separate dashboards for different administrative roles.

Similarly, subscribers use a shared dashboard structure, but each subscriber must only access their own authorized data and assigned content.

The following breakdown describes the main business domains and functional modules expected in the platform. It is intended to clarify the business model and guide architectural decisions, not to prescribe a rigid implementation order.

## 2. Admin Dashboard — Business Modules

Although the administration interface is centralized, it contains several distinct business modules.

### 01. Dashboard Overview

The administrative homepage provides a high-level summary of the platform's operational status.

Expected functionality:

- Total registered subscribers.
- Active and expired subscriptions.
- Summary of subscriber progress and adherence.
- Key operational indicators.
- Quick access to important administrative actions.

The overview should present relevant summaries rather than loading large amounts of underlying subscriber or historical data unnecessarily.

### 02. Subscriber Management

Responsible for managing subscriber accounts throughout their lifecycle.

Expected functionality:

- View, search, filter, and paginate subscriber records.
- Review registration requests and approve or reject them.
- Create subscriber accounts and update account information.
- Suspend and reactivate accounts.
- Access individual subscriber profiles and historical records.
- Review account status and relevant subscription information.

Subscriber identity, account status, and access permissions must remain consistent across the application.

### 03. Subscriptions & Packages

Responsible for defining subscription packages and managing subscriber subscriptions.

Expected functionality:

- Create and update subscription packages.
- Assign packages to subscribers.
- Manually activate, renew, suspend, and terminate subscriptions.
- Set subscription start and expiration dates.
- Define package-related content access rules.
- Enforce access restrictions based on subscription status and assigned entitlements.
- Maintain relevant subscription history.

Online payment processing and automatic billing are outside the initial project scope. Subscription activation and renewal will be managed manually.

### 04. Workout Programs

Responsible for creating, maintaining, and assigning workout programs.

Expected functionality:

- Create workout programs and reusable templates.
- Define workout days, exercises, sets, repetitions, and rest periods.
- Add exercise instructions and training notes.
- Associate exercises with instructional videos.
- Assign programs to individual subscribers.
- Update programs and maintain previous versions or historical records.
- Review subscriber workout completion and performance data.

The system should distinguish reusable workout templates from the actual programs assigned to subscribers. Changes to a reusable template should not unintentionally overwrite existing subscriber programs or historical records.

### 05. Nutrition Programs

Responsible for creating and managing nutrition plans.

Expected functionality:

- Create nutrition programs and reusable meal templates.
- Define meals, quantities, and instructions.
- Include calories and macronutrients when this information is available.
- Assign customized nutrition plans to subscribers.
- Review nutrition adherence records.
- Retain previous nutrition plans and relevant history.

The platform delivers and tracks trainer-approved nutrition programs. It does not independently generate medical or therapeutic dietary prescriptions.

### 06. Content Library

A centralized library for managing the trainer's digital content.

Supported content includes:

- Workout program PDFs.
- Nutrition program PDFs.
- Exercise instructional videos.
- Educational documents.
- Reference materials and reusable content resources.

Authorized administrators should be able to upload, organize, update, and associate content with programs or subscribers.

Content access must be controlled according to user permissions, assigned programs, and subscription entitlements.

Video storage and streaming should be treated as a distinct infrastructure concern because of the expected library size and the potential impact of bandwidth costs.

### 07. Progress Tracking

Responsible for reviewing subscriber progress over time.

Expected functionality:

- Body weight history.
- Body measurements.
- Progress photos.
- Athletic performance records.
- Workout adherence rates.
- Nutrition adherence rates.
- Progress charts and historical comparisons.
- Access to relevant historical program assignments.

The trainer should be able to review an individual subscriber's progress without exposing that subscriber's private information to unauthorized users.

### 08. Administrative Users & Permissions

Responsible for managing the trainer's administrative team.

Expected functionality:

- Manage administrative user accounts.
- Support the head trainer, assistants, and other authorized trainers.
- Define and assign administrative roles and permissions.
- Restrict sensitive operations according to each user's responsibilities.
- Protect privileged actions and sensitive subscriber information.

The head trainer retains full administrative privileges. Other administrative users receive only the permissions required for their assigned responsibilities.

Frontend visibility controls must not be treated as the security boundary. Sensitive operations and data access must also be enforced through the appropriate backend authorization mechanisms.

### 09. Notifications & Reports

Responsible for operational notifications, reporting, and data export.

Expected functionality:

- Registration and account approval emails.
- Subscription activation notifications.
- Upcoming subscription expiration reminders.
- Basic subscriber activity reports.
- Subscription and package summaries.
- Workout and nutrition adherence reports.
- Progress summaries.
- Content usage statistics where available.
- Export subscriber data and supported reports.

Reporting should be designed around the actual information required by the trainer, rather than repeatedly fetching or aggregating the entire database.

Automated WhatsApp messaging and advanced predictive analytics are outside the initial scope.

## 3. Subscriber Dashboard — Business Modules

The Subscriber Dashboard is not simply a document viewer. It is the subscriber's personal workspace for following and recording their training journey.

### 01. Home / Overview

Provides a summary of the subscriber's current status.

Expected functionality:

- Current subscription status.
- Current assigned workout and nutrition programs.
- Relevant upcoming subscription expiration information.
- Recent progress and activity summaries.
- Quick access to the subscriber's primary tasks.

### 02. My Subscription

Allows the subscriber to review their subscription information.

Expected functionality:

- Current package.
- Subscription status.
- Start and expiration dates.
- Relevant access restrictions or package entitlements.

Subscribers should not be able to activate, extend, or modify their own subscriptions unless such functionality is explicitly authorized in the future.

### 03. My Workouts

Allows the subscriber to follow their assigned workout program and record performance.

Expected functionality:

- View the assigned workout schedule.
- Access daily workout details and exercise instructions.
- Watch linked instructional videos.
- Mark exercises or workouts as completed.
- Enter requested performance data.
- Review previous workout sessions and relevant results.

Workout records should preserve the subscriber's actual historical performance rather than being overwritten when the assigned workout program changes.

### 04. My Nutrition

Allows the subscriber to access and follow their assigned nutrition plan.

Expected functionality:

- View assigned meal schedules.
- Read meal quantities and instructions.
- Review available calorie and macronutrient information.
- Record meal adherence.
- Review previous nutrition records where appropriate.

### 05. Videos & Documents

Provides access to authorized training materials.

Expected functionality:

- Watch assigned instructional videos.
- Open authorized PDF documents.
- Browse content associated with assigned programs.
- Respect subscription status and content permissions.

Subscribers must not gain access to private files simply by discovering a file URL or changing a frontend route.

### 06. My Progress

Allows the subscriber to record and review their personal progress.

Expected functionality:

- Record body weight.
- Enter body measurements.
- Upload progress photos.
- Review athletic performance records.
- View progress charts and historical comparisons.
- Review workout and nutrition adherence over time.

Each subscriber must only be able to access their own progress records unless an explicitly authorized administrative user accesses them.

### 07. History

Provides access to relevant historical information.

Expected functionality:

- Previous workout programs.
- Previous nutrition plans.
- Historical workout completion and performance records.
- Previous nutrition adherence records.
- Historical progress measurements and charts.
- Other relevant records retained by the platform.

Historical records should remain meaningful even when an active program or subscription changes.

### 08. My Profile

Allows the subscriber to manage their personal account information.

Expected functionality:

- View and update permitted profile details.
- Manage relevant account information.
- Access account-related settings.
- Use supported authentication and password-reset flows.

Sensitive account operations must follow the platform's authentication and authorization requirements.

## 4. Important Relationships Between Business Domains

The modules above are not completely independent. Their relationships should influence the architecture and implementation plan.

Consider the following business relationships:

- **Subscribers and Subscriptions:** A subscriber can have a history of subscriptions, while the current subscription determines their present access entitlements.
- **Subscriptions and Packages:** Packages define the available subscription options and associated entitlements. Subscription records represent the actual subscription assigned to a subscriber.
- **Workout Programs and Subscribers:** Reusable workout templates can be used to create or customize programs assigned to individual subscribers.
- **Nutrition Programs and Subscribers:** Reusable nutrition templates can be used to create or customize individual nutrition assignments.
- **Programs and Content:** Workout and nutrition programs can reference instructional videos, PDFs, and other relevant content.
- **Subscribers and Progress Records:** Weight, measurements, progress photos, workout performance, and adherence records belong to the relevant subscriber.
- **Administrative Users and Permissions:** Administrative permissions determine which users can perform management actions and access sensitive records.
- **Subscriptions and Content Access:** A subscriber's access to protected content depends on the applicable subscription rules, assigned programs, and authorization checks.
- **Reports and Operational Data:** Reports summarize information produced by the underlying business domains rather than becoming a separate source of truth.

These relationships describe the business model. The exact data model, collection structure, references, and access patterns should be designed after examining the requirements and expected queries.

## 5. Implementation Planning — Dependency-Aware, Not List-Driven

The numbered lists above describe functional domains, not a mandatory implementation sequence.

Do not assume that Module 01 must be implemented before Module 02, or that the order in this document represents the correct development order.

Instead, analyze the dependencies between business domains and determine a practical implementation sequence.

For each proposed module, consider:

- Which other modules or shared capabilities it depends on.
- Which foundational capabilities must exist before implementation.
- Whether it can be developed and tested independently.
- Whether its data model depends on another domain.
- Whether implementing it early would reduce rework in later modules.
- Whether it introduces important security, cost, or performance risks.
- Whether it provides a useful foundation for subsequent features.

For example, a dashboard overview depends on the existence of reliable underlying data and business operations. It may therefore be more appropriate to establish the relevant data models and workflows before implementing the full overview.

Similarly, workout history depends on workout assignments and performance tracking, while protected content access depends on authentication, authorization, subscription entitlements, and content metadata.

These are examples of dependency analysis, not a fixed implementation plan. Determine the actual sequence based on the complete requirements and repository.

### Expected Planning Outcome

Before implementing the business modules, identify:

1. The foundational capabilities required by multiple modules.
2. The main business domains and their boundaries.
3. The important dependencies between domains.
4. A sensible implementation sequence that minimizes rework.
5. Which modules can be implemented and tested independently.
6. The minimum initial structure needed to support the first implementation stage.
7. Which decisions can be postponed until more detailed requirements become available.

Avoid implementing every module simultaneously. Establish the necessary foundations, then build and validate the application incrementally.

## 6. Architecture and Implementation Principles

Use this business breakdown to guide the architecture of the existing React and Firebase project.

The objective is to build a platform that is scalable and maintainable without introducing unnecessary complexity.

Pay particular attention to:

- Clear boundaries between the public website, administrative area, and subscriber area.
- Separation of reusable templates from subscriber-specific assignments and historical records.
- Consistent authentication and authorization.
- Efficient Firebase data access and query patterns.
- Pagination, caching, and controlled data fetching.
- Predictable loading, error, and empty states.
- Sensible state management without unnecessary duplication.
- Cost-aware handling of Firestore reads, storage, and video delivery.
- Maintainable separation of pages, sections, components, hooks, services, and business logic.
- File sizes and component responsibilities that remain manageable as the product grows.

Do not create all pages, services, collections, hooks, and abstractions in advance simply because they appear in this document.

Create the initial structure around confirmed requirements and necessary foundations. Add detailed implementation files as each domain becomes the next development priority.

The goal is a clear understanding of the complete business model, combined with an architecture and implementation sequence that can evolve safely as the platform grows.
