# Task List - Suite Consolidation & Abstraction

## Pre-work: Monorepo Plumbing & Cleanup
- [x] Initialize `packages/config` for shared linting/formatting
- [x] Initialize `packages/core-domain` skeleton
- [x] Consolidate `packages/api_contracts` into `packages/contracts`
- [x] Verify root `package.json` and `turbo.json` configurations
- [x] Define Storage & Vault Ports in `child_safety_core`
- [x] Implement Azure-agnostic domain logic for Identity Vault

## Phase 1: Unified Contracts & Auto-gen
- [x] Expand `child-safety-v1.yaml` to include Vault, Tracker, and Communication endpoints
- [x] Configure `openapi-generator` for Python (Backend), TypeScript (Web), and Kotlin (Mobile)
- [x] Set up Turbo pipeline for automated model regeneration

## Phase 2: Mobile App Integration
- [x] Scaffold Android project structure in `apps/childSafetyMobile`
- [x] Integrate generated Kotlin models into the mobile module
- [x] Setup Hilt/Dependency Injection for IoC support

## Phase 3: Logic Abstraction (IoC)
- [x] Define shared interfaces (Ports) in `packages/core-domain`
- [x] Implement Web-specific adapters (IndexedDB)
- [x] Implement Mobile-specific adapters (Room)

## Phase 4: Final Integration & Verification
- [x] Connect Web/Mobile to Backend using generated clients
- [x] Implement local-to-remote synchronization logic
- [x] Perform end-to-end suite verification
