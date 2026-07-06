# Protocols, DNS, and the Internet vs the Web

The application layer of the TCP/IP stack (§2) is where the protocols you actually notice by name live: HTTP, HTTPS, FTP, SMTP. This lesson looks at what each one is for, how a domain name gets turned into an address a computer can use (**DNS**), and finally clears up a very commonly confused pair of terms: **the Internet** and **the World Wide Web**.

## Key application-layer protocols

A **protocol** is simply an agreed set of rules for communication — both ends must speak the same protocol to understand each other.

- **HTTP (HyperText Transfer Protocol)** — used by web browsers to request web pages from web servers, and by servers to send them back. It defines requests (e.g. "GET me this page") and responses (the page's content plus a status code).
- **HTTPS (HTTP Secure)** — exactly the same idea as HTTP, but the connection is **encrypted** (using TLS/SSL) so that data exchanged between browser and server can't be read or tampered with by anyone intercepting it in transit. Any website handling passwords, payment details or other sensitive data should use HTTPS.
- **FTP (File Transfer Protocol)** — used to transfer files between a client and a server, for example uploading the finished files of a website to the server that will host it, or downloading a large dataset.
- **SMTP (Simple Mail Transfer Protocol)** — used to **send** email: from an email client to its outgoing mail server, and between mail servers as a message is relayed towards its recipient's server. (Retrieving mail from a server to read it uses different protocols, not covered at this level.)

:::callout{kind="key"}
All four are **application-layer** protocols: they define what the data *means* (a page request, a file, a message) and rely on TCP underneath to actually get the bytes there reliably.
:::

## DNS: translating names to addresses

Computers route traffic using **IP addresses** (like `93.184.216.34`), but people want to type memorable names like `www.example.com`. The **DNS (Domain Name System)** bridges that gap: it is a distributed, hierarchical system that translates human-readable **domain names** into the IP addresses computers actually need to connect to each other — essentially acting as the Internet's phone book.

When you type a web address into a browser, roughly:

1. The browser asks a **DNS resolver** (usually run by your ISP or a public service) "what is the IP address for `www.example.com`?"
2. The resolver looks the name up (checking its cache first, then querying other DNS servers if needed) and returns an IP address, e.g. `93.184.216.34`.
3. The browser can now open a direct connection to that IP address to actually request the page.

Without DNS, you would have to remember and type the numeric IP address of every website you wanted to visit.

## The Internet vs the World Wide Web

These two terms are often used interchangeably in everyday speech, but at this level you must be able to tell them apart.

- **The Internet** is the physical and logical **infrastructure**: the global network of interconnected networks, the routers, cables, satellite links and protocols (like TCP/IP) that let any connected device exchange data with any other. The Internet existed, and was useful (for email, file transfer), before the Web did.
- **The World Wide Web (WWW, "the Web")** is a **service that runs on top of the Internet**: a huge collection of documents (web pages), linked to one another by **hyperlinks**, and accessed using HTTP/HTTPS. Browsing websites is *one of many* things the Internet is used for — email (SMTP) and file transfer (FTP) are other Internet services that are **not** part of the Web.

:::callout{kind="warning"}
A common exam-style error is writing "the Internet" when the correct term is "the Web" (or vice versa). Remember: **Internet = infrastructure (the network itself)**; **Web = one service that uses that infrastructure (linked documents via HTTP)**.
:::

:::reveal{title="Worked example: what happens when you visit a URL"}
You type `https://www.example.com/index.html` into your browser and press enter. Tracing it through DNS and then HTTP:

1. **Parse the URL.** The browser identifies the protocol (`https`), the domain name (`www.example.com`) and the requested resource path (`/index.html`).
2. **DNS lookup.** The browser (via a DNS resolver) asks "what is the IP address of `www.example.com`?" and gets back an answer, e.g. `93.184.216.34`.
3. **Establish a connection.** The browser opens a TCP connection to that IP address on the standard HTTPS port (443), and negotiates encryption (TLS) — this is what makes it *HTTPS* rather than plain HTTP.
4. **Send the HTTP request.** Over that secure connection, the browser sends an HTTP request: effectively "GET `/index.html`".
5. **Server responds.** The web server finds the requested page and sends it back as an HTTP response (a status code, e.g. `200 OK`, plus the page's HTML content), which travels back down through TCP/IP exactly as described in the previous lesson.
6. **Render.** The browser receives the HTML and displays the page. Any images, stylesheets or scripts the page references trigger further HTTP requests, each preceded by its own DNS lookup if it points to a different domain.

Notice that **DNS runs first, once, to find the address**, and **HTTP then runs over the connection to that address, to actually fetch the content** — the Web (HTTP) depends on, but is distinct from, the Internet's addressing and routing machinery (DNS, TCP, IP) underneath it.
:::

## Practice: protocol flashcards

Test yourself on what each protocol/system is for before moving on to the assessment.

::widget{type="flashcards" src="cards/protocols.json"}

## Practice quiz

::py{src="items/networks-quiz.py" params='{"topic": "protocols"}'}
