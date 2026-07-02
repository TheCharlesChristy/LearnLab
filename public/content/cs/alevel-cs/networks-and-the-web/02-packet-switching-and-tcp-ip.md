# Packet switching and the TCP/IP stack

When you send a message across a network — an email, a photo, a request for a web page — it almost never travels as one continuous stream. Instead it is chopped up, addressed, sent piece by piece, and reassembled at the other end. This lesson covers that process (**packet switching**) and the layered set of rules that make it reliable (the **TCP/IP stack**).

## Packet switching

**Packet switching** is the method used to move data across the Internet:

1. The sending device breaks the data into small units called **packets**.
2. Each packet is wrapped with a **header** containing information such as the source address, the destination address, and a **sequence number** (its position in the original message) — followed by the **payload**, the actual chunk of data being carried.
3. Packets are sent independently onto the network. Different packets belonging to the *same* message **can take different routes** to the destination, depending on which paths are free or fastest at that moment.
4. Because packets can arrive **out of order**, or be delayed, or occasionally be lost, the destination device uses the sequence numbers to **reassemble** them back into the original data, requesting any missing packets be resent.

:::callout{kind="key"}
Packet switching's big advantage over sending one continuous stream down a single dedicated connection is **efficiency and resilience**: many messages from many devices can share the same network links at once, and if one route becomes congested or fails, later packets can simply be sent a different way.
:::

## The TCP/IP stack

Rather than one protocol doing everything, network communication is split into **layers**, each responsible for one job and relying on the layer below it. The TCP/IP model has four layers:

| Layer | Role | Example protocols |
| --- | --- | --- |
| **Application** | Provides the service the user/software actually wants (a web page, an email, a file transfer) | HTTP, HTTPS, FTP, SMTP, DNS |
| **Transport** | Splits data into segments, and manages reliable delivery between the two end devices | TCP (also UDP, not covered here) |
| **Internet** | Addresses devices and routes packets across different networks to their destination | IP |
| **Link** (network access) | Handles the physical transmission of raw bits over the actual hardware (cables, radio) between devices on the same local network | Ethernet, Wi-Fi |

Data travels **down** the stack on the sending device (each layer wraps the data from the layer above with its own header — this is called **encapsulation**) and **up** the stack on the receiving device (each layer strips off its own header and passes the rest upward — **decapsulation**).

### TCP's role

**TCP (Transmission Control Protocol)** operates at the transport layer and is responsible for:

- **Splitting** the application's data into manageable segments.
- **Reliable delivery** — numbering each segment, waiting for acknowledgements, and **retransmitting** any segment that is lost or arrives corrupted.
- **Reassembly** — using the sequence numbers to put the segments back in the correct order at the destination, even if they didn't arrive in that order.

### IP's role

**IP (Internet Protocol)** operates at the internet layer and is responsible for:

- **Addressing** — giving every device on a network a unique IP address so it can be identified.
- **Routing** — getting each individual packet from its source to its destination, potentially via many intermediate routers, choosing a path across interconnected networks.

IP itself makes no promises about order or reliability — a packet might arrive late, out of order, or not at all. It is TCP, sitting above it, that turns IP's "best effort" delivery into a reliable connection. This division of labour is why the whole suite is named **TCP/IP**.

:::reveal{title="Worked example: encapsulation when sending one message"}
Suppose an application on your computer sends the text `"HI"` to a server.

1. **Application layer**: the application hands `"HI"` to TCP.
2. **Transport layer**: TCP wraps it in a segment with a header carrying (among other things) a sequence number and the destination **port number**, e.g. `[TCP header: seq=1, port=80][HI]`.
3. **Internet layer**: IP wraps that whole segment in a packet with a header carrying the source and destination **IP addresses**, e.g. `[IP header: src=10.0.0.5, dest=93.184.216.34][TCP header][HI]`.
4. **Link layer**: the link layer wraps that packet in a frame with a header carrying the source and destination **MAC addresses** for the next hop, e.g. `[Link header: src MAC, dest MAC][IP header][TCP header][HI]`, then transmits it as electrical/radio signal.

At the destination, this process runs in **reverse**: the link layer strips its header and hands the packet up to IP, which strips its header and hands the segment up to TCP, which strips its header, checks the sequence number, and finally hands the original `"HI"` up to the receiving application. Every layer only ever has to understand its own header — that separation of concerns is the whole point of a layered stack.
:::

## Try it: building packets from a message

The playground below splits a short message into fixed-size chunks and gives each one a header, just like a transport layer preparing data for the network layer below it. Run it, then try changing `payload_size` or `message` to see how the number of packets changes.

::widget{type="code-runner" language="python" starter="message = 'HELLO NETWORKS'\npayload_size = 5  # characters per packet, for simplicity\n\ndef make_packets(data, size, src='10.0.0.5', dest='10.0.0.9'):\n    packets = []\n    seq = 0\n    for i in range(0, len(data), size):\n        chunk = data[i:i + size]\n        header = {'seq': seq, 'src': src, 'dest': dest, 'length': len(chunk)}\n        packets.append({'header': header, 'payload': chunk})\n        seq += 1\n    return packets\n\nfor p in make_packets(message, payload_size):\n    print(p)" rows=14}

## Practice

::py{src="items/networks-quiz.py" params='{"topic": "packets"}'}
