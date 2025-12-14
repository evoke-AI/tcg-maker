# 🚀 Programming Principles & Troubleshooting Guide

*A practical guide to universal programming principles and troubleshooting patterns for maintaining clean, bug-free code*

## 🎯 Purpose

This guide focuses on **universal programming principles** and **troubleshooting patterns** that help prevent and solve common issues in any codebase. It's designed as a troubleshooting companion that helps you identify problems early and apply the right solutions.

**Core Philosophy:** Write code that works reliably, fails gracefully, and can be debugged easily.

---

## 🔄 Infinite Loops & Circular Dependencies

### 🚨 Problem Signs:
- Functions that trigger themselves indirectly
- Objects recreated on every execution cycle
- Missing or incorrect dependency tracking
- Circular references between modules

### ✅ Solutions:

#### 1. **Memoization for Expensive Operations**
```pseudocode
// ❌ Bad: Function recreated every time
function processData() {
  expensiveOperation = () => { /* heavy computation */ }
  
  onDataChange(() => {
    expensiveOperation()
  }, [expensiveOperation]) // Triggers infinite loop!
}

// ✅ Good: Memoized operation
function processData() {
  expensiveOperation = memoize(() => { /* heavy computation */ }, [dependency1, dependency2])
  
  onDataChange(() => {
    expensiveOperation()
  }, [expensiveOperation]) // Safe - stable reference
}
```

#### 2. **Proper Dependency Tracking**
```pseudocode
// ❌ Bad: Missing dependencies
function updateUI() {
  onStateChange(() => {
    if (user && isActive) {
      refreshDisplay()
    }
  }, []) // Missing user, isActive, refreshDisplay
}

// ✅ Good: All dependencies tracked
function updateUI() {
  onStateChange(() => {
    if (user && isActive) {
      refreshDisplay()
    }
  }, [user, isActive, refreshDisplay])
}
```

#### 3. **Avoid Object Recreation**
```pseudocode
// ❌ Bad: Object recreated every cycle
function configureService() {
  config = { apiKey: key, baseUrl: url }
  onConfigChange(() => {
    initializeService(config)
  }, [config]) // Infinite loop!
}

// ✅ Good: Primitive dependencies
function configureService() {
  onConfigChange(() => {
    config = { apiKey: key, baseUrl: url }
    initializeService(config)
  }, [key, url])
}
```

---

## 🏪 State Management & Decoupling

### 🚨 Problem Signs:
- Tight coupling between unrelated modules
- Data passed through multiple layers unnecessarily
- Complex interdependent state logic
- State persisting after cleanup

### ✅ Solutions:

#### 1. **Centralized State for Shared Data**
```pseudocode
// ❌ Bad: Prop drilling through layers
class MainApp {
  function render() {
    return ComponentA(user, settings, permissions, theme, language)
  }
}

class ComponentA {
  function render(user, settings, permissions, theme, language) {
    return ComponentB(user, settings, permissions, theme, language)
  }
}

// ✅ Good: Centralized state access
class GlobalStore {
  user: User
  settings: Settings
  permissions: Permissions
  theme: Theme
  language: Language
}

class ComponentA {
  function render() {
    // Access only what's needed
    user = GlobalStore.getUser()
    return ComponentB()
  }
}
```

#### 2. **Atomic State Operations**
```pseudocode
// ❌ Bad: Multiple separate state updates
function disconnect() {
  setConnectionStatus("DISCONNECTED")
  setIsProcessing(false)
  setErrorMessage("")
  setUserInput("")
}

// ✅ Good: Single atomic operation
function disconnect() {
  resetConnectionState({
    status: "DISCONNECTED",
    isProcessing: false,
    errorMessage: "",
    userInput: ""
  })
}
```

#### 3. **Defensive State Validation**
```pseudocode
// ❌ Bad: Processing without validation
function handleEvent(event) {
  processEvent(event) // May process stale events
}

// ✅ Good: Validate state before processing
function handleEvent(event) {
  if (connectionState != "CONNECTED" && event.type != "session.created") {
    log("Ignoring event " + event.type + " - not connected")
    return
  }
  
  processEvent(event)
}
```

---

## 📡 Resource Management & Cleanup

### 🚨 Problem Signs:
- Memory leaks from uncleaned resources
- Operations continuing after termination
- Connections not properly closed
- Event listeners accumulating

### ✅ Solutions:

#### 1. **Proper Resource Cleanup**
```pseudocode
// ❌ Bad: No cleanup
function setupService() {
  subscription = dataSource.subscribe(callback)
  // No cleanup - memory leak!
}

// ✅ Good: Always cleanup
function setupService() {
  subscription = dataSource.subscribe(callback)
  
  return cleanup() {
    subscription.unsubscribe()
  }
}
```

#### 2. **Connection State Tracking**
```pseudocode
// ❌ Bad: Stale state access
function setupConnection() {
  connection.onMessage((data) => {
    handleMessage(data) // May process after disconnect
  })
}

// ✅ Good: Real-time state tracking
function setupConnection() {
  isConnected = true
  
  connection.onMessage((data) => {
    if (isConnected) {
      handleMessage(data)
    }
  })
  
  connection.onDisconnect(() => {
    isConnected = false
  })
}
```

#### 3. **Graceful Termination**
```pseudocode
// ❌ Bad: Abrupt termination
function disconnect() {
  connection.close()
  setState("DISCONNECTED")
}

// ✅ Good: Graceful shutdown sequence
function disconnect() {
  // 1. Mark as disconnecting
  isConnected = false
  
  // 2. Cancel ongoing operations
  if (connection.isOpen()) {
    connection.send({ type: "cancel_operations" })
  }
  
  // 3. Cleanup resources
  cleanupResources()
  
  // 4. Close connection
  connection.close()
  
  // 5. Update state
  setState("DISCONNECTED")
}
```

---

## 🎯 Type Safety & Error Prevention

### 🚨 Problem Signs:
- Runtime type errors
- Undefined property access
- Silent failures
- Inconsistent data handling

### ✅ Solutions:

#### 1. **Explicit Type Definitions**
```pseudocode
// ❌ Bad: Untyped data
function handleEvent(event) {
  // No type safety
  processData(event.data.payload.items)
}

// ✅ Good: Explicit types
interface ServerEvent {
  type: string
  data?: {
    payload?: {
      items?: Item[]
    }
  }
}

function handleEvent(event: ServerEvent) {
  if (event.data?.payload?.items) {
    processData(event.data.payload.items)
  }
}
```

#### 2. **Safe Default Values**
```pseudocode
// ❌ Bad: Falsy values treated as null
value = input || defaultValue // "" becomes defaultValue

// ✅ Good: Only null/undefined trigger default
value = input ?? defaultValue // "" stays ""
```

---

## 🛠️ Code Organization & Maintainability

### 📁 File Organization Principles

**🚨 When to Split:**
- Module exceeds reasonable size (400+ lines)
- Multiple unrelated responsibilities
- Difficult to navigate or understand
- Complex interdependent logic

**✅ Splitting Strategy:**
```pseudocode
// ❌ Bad: Monolithic module
class GodClass {
  // Connection management (100 lines)
  // Settings persistence (100 lines)  
  // Device enumeration (100 lines)
  // UI state management (100 lines)
  // Session configuration (100 lines)
  // Agent management (100 lines)
}

// ✅ Good: Focused modules
class ConnectionManager {
  // Only connection logic
}

class SettingsManager {
  // Only settings persistence
}

class DeviceManager {
  // Only device enumeration
}

class UIStateManager {
  // Only UI state
}
```

### 🔍 Debugging Patterns

**✅ Effective Logging:**
```pseudocode
// Add context to logs
log("Starting connection process...")
warn("Ignoring event " + eventType + " - session disconnected")

// Log state transitions
log("Configuration updated", {
  vadType: vadType,
  noiseReduction: noiseReduction,
  isActive: isActive
})
```

**✅ Defensive Programming:**
```pseudocode
// Check preconditions
if (!configSet || !selectedAgent) {
  return
}

// Validate state before operations
if (sessionStatus == "DISCONNECTED") {
  warn("Ignoring operation - session disconnected")
  return
}
```

---

## 🚨 Common Anti-Patterns to Avoid

### ❌ **The "God Module"**
- Single module handling everything
- 500+ lines with multiple responsibilities
- **Fix:** Split by domain (connection, settings, UI)

### ❌ **Tight Coupling**
- Modules directly accessing each other's internals
- Hard-coded dependencies
- **Fix:** Use interfaces and dependency injection

### ❌ **Silent Failures**
- Catching errors without handling them
- Generic error messages
- **Fix:** Let errors bubble up, log with context

### ❌ **Resource Leaks**
- Uncleaned event listeners
- Unsubscribed observables
- Open connections after termination
- **Fix:** Always implement cleanup functions

### ❌ **Stale State Access**
- Using outdated state in async operations
- Event handlers with outdated references
- **Fix:** Use real-time state tracking, proper validation

---

## 🎯 Quick Troubleshooting Checklist

### 🔄 **Infinite Loops:**
```
□ Are all dependencies properly tracked?
□ Are expensive operations memoized?
□ Are objects being recreated every cycle?
□ Is the dependency tracking correct?
```

### 🏪 **State Issues:**
```
□ Is state being cleared on cleanup?
□ Are operations validated before execution?
□ Is there unnecessary coupling between modules?
□ Are state updates atomic?
```

### 🔗 **Resource Problems:**
```
□ Are resources properly cleaned up?
□ Is cleanup happening in the right order?
□ Are termination signals being sent?
□ Is resource state tracked accurately?
```

### 🎯 **Type Errors:**
```
□ Are types explicitly defined?
□ Are null checks in place?
□ Are interfaces properly defined?
□ Is safe defaulting used correctly?
```

---

## 📚 Universal Principles Applied

- **Single Responsibility:** Each module does one thing well
- **Separation of Concerns:** Decouple unrelated functionality
- **Defensive Programming:** Validate before processing
- **Resource Management:** Always cleanup what you create
- **Type Safety:** Make invalid states unrepresentable
- **Fail Fast:** Catch errors early and explicitly
- **Immutability:** Prefer immutable operations where possible

---

## 🎉 Success Metrics

**You're doing it right when:**
- ✅ No infinite loops or memory leaks
- ✅ State changes are predictable and atomic
- ✅ Errors are visible and debuggable
- ✅ Modules are focused and manageable
- ✅ Types are safe and explicit
- ✅ Cleanup happens reliably
- ✅ Code reviews are smooth and fast

**Remember:** These patterns prevent bugs before they happen and make debugging faster when issues do arise. Follow them consistently for a maintainable, reliable codebase. 