# Network types, topologies and hardware

A **network** is two or more devices connected together so they can exchange data. Almost everything in modern computing — from printing a document to loading a web page — depends on a network of some kind. This lesson covers how networks are classified by size, how their devices can be physically/logically arranged (**topology**), the hardware that makes them work, and the two basic models of who talks to whom.

## LAN vs WAN

Networks are usually classified by the geographical area they cover.

- A **LAN (Local Area Network)** covers a small area — a single building or site — and is normally owned and managed by one organisation. A school's network of classroom computers, or a home Wi-Fi network, is a LAN.
- A **WAN (Wide Area Network)** spans a large geographical area — a city, a country, or the whole planet — and typically connects multiple LANs together. A WAN usually relies on infrastructure (leased lines, satellite links, fibre) owned by third parties such as telecommunications companies. **The Internet is the largest WAN in existence**: a network of networks.

:::callout{kind="key"}
The distinction is about **scale and ownership**, not raw speed: a school's LAN can easily be faster than the WAN link connecting it to the Internet.
:::

## Network topologies

A network's **topology** is the pattern in which its devices are connected. Two of the most important topologies to know are star and bus.

### Star topology

Every device connects individually, via its own cable, to one central device — usually a **switch**.

| Advantage | Disadvantage |
| --- | --- |
| A single faulty cable only affects the one device attached to it | The central switch is a **single point of failure** — if it fails, every device loses the ability to communicate |
| Easy to add or remove a device without disrupting the rest of the network | Requires more cabling than a bus, since every device needs its own run back to the centre |
| Performance stays good as more devices are added, since traffic between two devices doesn't have to pass through every other device | Cost of the central switch |

### Bus topology

Every device connects to a single shared cable (the "bus"), which has a **terminator** at each end to stop signals reflecting back down the wire.

| Advantage | Disadvantage |
| --- | --- |
| Cheap and simple — little cabling needed | If the shared cable breaks, the whole network (or a whole section of it) can stop working |
| Easy to set up for a small, temporary network | Only one device can transmit at a time; more devices means more collisions and slower performance |
| No dependency on one central device | Diagnosing a fault means checking the whole length of cable |

:::callout{kind="tip"}
A quick way to remember the trade-off: star topology trades **more cabling** for **resilience to a single cable fault**; bus topology trades that resilience for **cheap simplicity**. Failure of the *central* device is what kills a star network; failure of the *shared cable* is what kills a bus network.
:::

## Network hardware

Three pieces of hardware come up again and again at this level of detail.

- **NIC (Network Interface Card)** — the hardware inside a device (built into the motherboard or a plug-in card) that lets it physically connect to a network, wired or wireless. Every NIC has a unique **MAC address** burned into it at manufacture, used to identify the device on its local network.
- **Switch** — connects devices *within* the same LAN. It looks at the destination **MAC address** of each incoming frame and forwards it only out of the port the destination device is connected to (rather than broadcasting it to every device, the way an older, simpler "hub" would). This makes efficient use of the network's capacity.
- **Router** — connects *different* networks together (for example, a home LAN to the WAN of an Internet Service Provider). It looks at the destination **IP address** of each packet and decides which network to forward it towards, based on routing information. A typical home "router" is really a combined switch + router + wireless access point in one box.

:::callout{kind="info"}
A simple way to keep switch and router apart: a **switch moves frames around inside one network** using MAC addresses; a **router moves packets between different networks** using IP addresses.
:::

## Client-server vs peer-to-peer

These are the two basic models for how devices on a network share work and resources.

- **Client-server model**: one or more powerful, centrally-managed **servers** provide a service (storing files, serving web pages, running a database), and **clients** request that service. Clients don't provide services to each other directly. Most websites, email, and school network file storage work this way — centralised control, security and backups are easier, but the server is a bottleneck and a single point of failure.
- **Peer-to-peer (P2P) model**: there is no dedicated server. Every device (**peer**) can act as *both* a client and a server, requesting resources from other peers and providing its own resources to them. File-sharing networks are the classic example. P2P avoids a single point of failure and doesn't need expensive central hardware, but it's harder to secure and manage consistently, since there is no central authority.

:::reveal{title="Worked example: choosing a model and a topology"}
A small design studio has 12 computers in one office and wants them to share a single set of project files reliably, with one person responsible for backups.

**Network model:** client-server. A dedicated file server holds the single authoritative copy of every project file; all 12 workstations are clients. This makes the promised "one person responsible for backups" straightforward — they only need to back up the server, not 12 separate machines.

**Topology:** star. All 12 workstations and the server connect to one switch. If a single cable or workstation fails, the other 11 people keep working — that matters more to a working studio than the small extra cost of running 12 individual cables back to the switch, which is precisely what a bus topology would save on.

So: **client-server model, star topology, connected through a switch** — with a router only needed at the edge, to give the office LAN access to the wider Internet (e.g. for email).
:::

## Try it: a switch's forwarding table

A switch decides where to send a frame by looking up the destination MAC address in a table it has learned. Run the playground below to see the idea in miniature, then try adding your own address to the table or looking up an address that isn't there.

::widget{type="code-runner" language="python" starter="mac_table = {\n    'AA:AA:AA:AA:AA:01': 1,\n    'BB:BB:BB:BB:BB:02': 2,\n    'CC:CC:CC:CC:CC:03': 3,\n}\n\ndef forward(destination_mac):\n    port = mac_table.get(destination_mac)\n    if port is None:\n        return 'unknown destination -> flood to all ports'\n    return f'forward out of port {port}'\n\nprint(forward('BB:BB:BB:BB:BB:02'))\nprint(forward('ZZ:ZZ:ZZ:ZZ:ZZ:99'))" rows=12}

## Practice

::py{src="items/networks-quiz.py" params='{"topic": "hardware"}'}
