# Copyma

_Solana Python 客户端生成器，由 Codama 驱动_

该软件包为 [Codama](https://github.com/codama-idl/codama) 提供了一个 Solana Python 客户端渲染器，可以根据 Solana 程序 IDL 文件生成 Python 客户端代码。

该工具目前处于测试阶段，如有任何问题或反馈，请及时提出。

## 安装

```sh
pnpm install copyma
```



## 使用方法

一旦你有了 Codama IDL，就可以使用本软件包的 `renderVisitor` 来生成 Python 客户端。你需要提供生成文件保存的基本目录，以及一组可选的选项来自定义输出。

```ts
// node ./codama.mjs
import { renderVisitor } from 'copyma';

const pathToGeneratedFolder = path.join(__dirname, 'clients', 'python', 'src', 'generated');
const options = {}; // 见下文。
codama.accept(renderVisitor(pathToGeneratedFolder, options));
```

## 生成的文件目录结构

```
.
├── accounts
│   ├── foo_account.py
│   └── __init__.py
├── instructions
│   ├── some_instruction.py
│   ├── other_instruction.py
│   └── __init__.py
├── types
│   ├── bar_struct.py
│   ├── baz_enum.py
│   └── __init__.py
├── errors
│   ├── custom.py
│   └── __init__.py
└── program_id.py
```

## 依赖项

```
    "borsh-construct>=0.1.0",
    "anchorpy>=0.21.0",
    "solana>=0.36.6",
    "solders>=0.26.0",
```

## 示例

### 指令 (Instructions)

```python
from solders.hash import Hash
from solders.keypair import Keypair
from solders.message import Message
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solana.rpc.async_api import AsyncClient
from my_client.instructions import some_instruction

 # 调用一个指令
foo_account = Keypair()
async with AsyncClient("http://127.0.0.1:8899") as client:
    res = await client.is_connected()
    # 在实际使用中，从 RPC 获取这个值
    recent_blockhash = (await client.get_latest_blockhash()).value.blockhash

    ix = some_instruction({
        "foo_param": "...",
        "bar_param": "...",
        ...
        },
        {
            "foo_account": foo_account.pubkey(), # 签名者
            "bar_account": Pubkey("..."),
            ...
        })
    msg = Message(instructions=[ix], payer=payer.pubkey())
    try:
        transaction = Transaction([foo_account], msg, recent_blockhash)
        result = (await client.simulate_transaction(transaction))
        print(result)
    except BaseException as e:
        print(f"BaseException failed: {e}")
        return None

```

### 账户 (Accounts)

```python
from solders.pubkey import Pubkey
from my_client.accounts import FooAccount

# 获取一个账户
addr = Pubkey("...")

acc = await FooAccount.fetch(connection, addr)
if acc is None:
    # 当账户未初始化时，fetch 方法会返回 null
    raise ValueError("account not found")


# 转换为 JSON 对象
obj = acc.to_json()
print(obj)

# 从 JSON 加载
acc_from_json = FooAccount.from_json(obj)
```

### 类型 (Types)

```python
# 结构体

from my_client.types import BarStruct

bar_struct = BarStruct(
  some_field="...",
  other_field="...",
)

print(bar_struct.to_json())
```

```python
# 枚举

from my_client.types import bazEnum

tupleEnum = bazEnum.SomeTupleKind((True, False, "some value"))
structEnum = bazEnum.SomeStructKind({
  "field1": "...",
  "field2": "...",
})
discEnum = bazEnum.SomeDiscriminantKind()

print(tupleEnum.toJSON(), structEnum.toJSON(), discEnum.toJSON())
```

```python
# 类型作为指令调用的参数（在需要时）：
ix = some_instruction({
  "some_struct_field": bar_struct,
  "some_enum_field": tuple_enum,
  # ...
}, {
  # 账户
  # ...
})

# 对于结构体字段，也可以将它们作为对象传递：
ix = some_instruction({
  "some_struct_field": {
    "some_field": "...",
    "other_field": "...",
  },
  # ...,
}, {
  # 账户
  # ...
})
```

### 错误 (Errors)

```python
from solana.rpc.core import RPCException
from my_client.errors import from_tx_error
from my_client.errors.custom import SomeCustomError

try:
  await provider.send(tx, [payer])
except RPCException as exc:
    parsed = from_tx_error(exc)
    raise parsed from exc
```

### 程序 ID (Program ID)

程序 ID 是根据 IDL 中提供的程序地址生成的。如果 IDL 中没有提供，则需要手动填写。

### 描述

生成的代码使用了 AnchorPy 代码生成方法和一些底层结构。

增加了对 Codama 的支持，并包含了一些 AnchorPy 不支持的数据结构，例如 FixedSizeType、SizePrefixType、HiddenSuffixType、HiddenPrefixType 和 EnumIndexU32Type。