# 🔐 Auto-Logout: 15-Minute Idle Timeout

## Quick Implementation (3 Files)

### 1️⃣ Create Hook: `src/hooks/useAutoLogout.ts`
Copy from: FRONTEND_AUTO_LOGOUT.md (lines 7-90)

### 2️⃣ Create Modal: `src/components/IdleWarningModal.tsx`  
Copy from: FRONTEND_AUTO_LOGOUT.md (lines 92-180)

### 3️⃣ Add to App: `src/App.tsx`
```typescript
import { useState } from 'react';
import { useAutoLogout } from './hooks/useAutoLogout';
import { IdleWarningModal } from './components/IdleWarningModal';

function App() {
  const [showWarning, setShowWarning] = useState(false);

  useAutoLogout({
    timeout: 15 * 60 * 1000,        // 15 minutes idle
    warningTime: 1 * 60 * 1000,      // 1 minute warning
    onWarning: () => setShowWarning(true),
  });

  return (
    <>
      {showWarning && (
        <IdleWarningModal onContinue={() => setShowWarning(false)} />
      )}
      
      <Routes>...</Routes>
    </>
  );
}
```

---

## ✅ What It Does

- **15 minutes** of no activity → auto logout
- **14:00 mark** → warning modal appears
- **Countdown** from 60 seconds
- **Any activity** → resets timer
- **Auto-clears** tokens + redirects to login

---

## 🧪 Test Mode (2 minutes instead of 15)

```typescript
useAutoLogout({
  timeout: 2 * 60 * 1000,      // 2 min for testing
  warningTime: 30 * 1000,      // 30 sec warning
  onWarning: () => setShowWarning(true),
});
```

**After testing works:** Change back to 15 minutes!

---

## 🎯 Activities That Reset Timer

✅ Mouse movement  
✅ Keyboard typing  
✅ Clicking  
✅ Scrolling  
✅ Touch (mobile)

**No changes needed** - works automatically!

---

**Full guide:** See `FRONTEND_AUTO_LOGOUT.md` for complete code + options
