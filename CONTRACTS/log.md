 node scripts/createPool.js
[dotenv@17.2.3] injecting env (3) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
Using wallet: 0xd5A3259cc15C588EdAF23FaFB9620910580189f4
Network chainId: 11142220
Factory code length: 41844
Token code length: 6860
Creating pool with config:
- Token: 0x8aeb43189Bd1d8e4Bbd8e2496A523Ff68d890D08
- Contribution Amount: 100.0 tokens
- Cycle Duration: 300 seconds
- Min Members: 2
- Max Members: 5
- Creator: 0xd5A3259cc15C588EdAF23FaFB9620910580189f4

Creating pool...
staticCall passed (no revert)
Transaction hash: 0x6458ea0d886811b7a4fd027122d34625de701ed56a53971cb04543d6a58f97cc
Transaction confirmed in block: 6023519

✅ Pool created successfully!
Pool Address: 0x1C750B391DDe6c7049da2aD69d223313f9350e5a
PS D:\0hack\token2049\v2> node scripts/joinPool.js
[dotenv@17.2.3] injecting env (6) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
pv1: 0x7f891974d700C6C1F4064f0E4AA85A42E45E2577
pv2: 0xbE397e8CA911009E5d0513B89f3FF8ca02d24c29
chainId: 11142220
pv1 -> requestJoin()...
tx1: 0x0f44f9c5fd23d78e2edb0eb831e19683aac604d66deb757b277062c47c909943
pv1 requestJoin confirmed
pv2 -> requestJoin()...
tx2: 0xe71a5bc7ba416a1f9e6ea3fb44b5d9674287359fa0d846d1af1dfe6da8b88a99
pv2 requestJoin confirmed
current members (may still be empty until creator approves): Result(0) []
PS D:\0hack\token2049\v2> node scripts/approveAllJoins.js
[dotenv@17.2.3] injecting env (6) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
creator: 0xd5A3259cc15C588EdAF23FaFB9620910580189f4
pending requests: Result(2) [
  '0x7f891974d700C6C1F4064f0E4AA85A42E45E2577',
  '0xbE397e8CA911009E5d0513B89f3FF8ca02d24c29'
]
approveAllJoins()...
tx: 0xb02ebabed4973055eadef4a555ed8a7e09bb00ba0a3494cf102c921c8437ef56
approveAllJoins confirmed
members: Result(2) [
  '0xbE397e8CA911009E5d0513B89f3FF8ca02d24c29',
  '0x7f891974d700C6C1F4064f0E4AA85A42E45E2577'
]
PS D:\0hack\token2049\v2>

 node scripts/startPool.js
[dotenv@17.2.3] injecting env (6) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
creator: 0xd5A3259cc15C588EdAF23FaFB9620910580189f4
status (0 Created, 1 Active): 0
members: 2
start() ...
tx: 0xdd68478ca7c88447f8ffbbb967fdf26a81090d5f444519d3504bc63adeca72a8
start confirmed in block: 6026087
currentCycle: 1
status now: 1
PS D:\0hack\token2049\v2>


PS D:\0hack\token2049\v2> node scripts/approveAndContribute.js
[dotenv@17.2.3] injecting env (6) from .env -- tip: 🔑 add access controls to secrets: https://dotenvx.com/ops
pv1: 0x7f891974d700C6C1F4064f0E4AA85A42E45E2577
pv1 target cycle: 1 amount: 100.0
pv1 approve tx: 0xaf656699739266714735d94ae709c8a2e0a113ae86568476ba0d8e3cafe3ff50
pv1 contribute tx: 0x3d22ed86841fae47dd406037271c495cbe12b73298495e381efe5dbe038a7f99
pv1 contributed for cycle 1
pv2: 0xbE397e8CA911009E5d0513B89f3FF8ca02d24c29
pv2 target cycle: 1 amount: 100.0
pv2 approve tx: 0x5882ba1a21977736994884c11f41f57ebd030c946733656eb2bcc10dbb2681c5
pv2 contribute tx: 0x98d1b7859523c660b67dc47f568301aced0175291a640395454f9982be2e7a87
pv2 contributed for cycle 1




PS D:\0hack\token2049\v2> node scripts/placeBids.js
[dotenv@17.2.3] injecting env (6) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
pv1: 0x7f891974d700C6C1F4064f0E4AA85A42E45E2577 bid: 65%
pv1 bidding amount: 65.0
pv1 bid tx: 0x02836c63d88cf9f44e16b81739936415a075e8c4170a692cf4c983a943e9e60b
pv1 bid confirmed
pv2: 0xbE397e8CA911009E5d0513B89f3FF8ca02d24c29 bid: 81%
pv2 bidding amount: 81.0
pv2 bid tx: 0x1ce1011b8f5a3e74d7c1f923c02145725d1d76b5fce68f09f4a4b2c09e514427
pv2 bid confirmed
PS D:\0hack\token2049\v2>