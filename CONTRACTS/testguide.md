Great! Now let's test the functions in the correct order. Here's the testing sequence:

## **Phase 1: Setup & Token Preparation**

### **1. Deploy TestToken (if not already deployed)**
```solidity
// Deploy TestToken first
TestToken.deploy()
```

### **2. Mint tokens to test accounts**
```solidity
// Mint tokens to your test accounts
testToken.mint(account1, 1000000) // 1M tokens
testToken.mint(account2, 1000000)
testToken.mint(account3, 1000000)
```

## **Phase 2: Pool Creation**

### **3. Create Pool via PoolFactory**
```solidity
// Create pool configuration
Config memory config = {
    token: testTokenAddress,
    contributionAmount: 100000, // 100k tokens per contribution
    cycleDuration: 300, // 5 minutes for testing
    minMembers: 2,
    maxMembers: 5,
    creator: yourAddress
};

// Create pool
address poolAddress = factory.createPool(config);
```

## **Phase 3: Join Request Phase**

### **4. Test Join Requests**
```solidity
// Users request to join
pool.requestJoin() // Call from account1, account2, account3
```

### **5. Test Creator Approval**
```solidity
// Creator approves members
pool.approveJoin(account1)
pool.approveJoin(account2) 
pool.approveJoin(account3)
// OR
pool.approveAllJoins() // Approve all at once
```

## **Phase 4: Pool Start**

### **6. Test Pool Start (Two Options)**

#### **Option A: Creator starts directly**
```solidity
pool.start() // Only creator can call
```

#### **Option B: Voting system**
```solidity
// Creator activates voting
pool.activateCycleStartVoting()

// Members vote to start
pool.voteToStartCycle() // Call from each member
// Auto-starts when 60% vote
```

## **Phase 5: Cycle Testing**

### **7. Test Contribution Phase**
```solidity
// Members contribute to cycle 1
pool.contribute(1) // Call from each member
```

### **8. Test Bidding Phase**
```solidity
// Bidding opens automatically after contribution phase
// Members place bids
pool.placeBid(1, 70000) // 70% bid
pool.placeBid(1, 80000) // 80% bid
pool.placeBid(1, 90000) // 90% bid
```

### **9. Test Settlement**
```solidity
// After cycle duration, settle
pool.settle(1) // Winner gets pot
```

## **Phase 6: Advanced Features**

### **10. Test Member Removal Voting**
```solidity
// Start removal vote
pool.startRemovalVote(targetMember)

// Members vote to remove
pool.voteToRemove(targetMember) // 80% threshold
```

### **11. Test Banning System**
```solidity
// If member misses contribution, they get banned
// Creator can unban
pool.unbanMember(bannedMember)
```

## **Recommended First Test:**
Start with **Phase 1-4** to test basic pool creation and joining, then move to **Phase 5** for the core cycle functionality.

**Which phase would you like to start with?**