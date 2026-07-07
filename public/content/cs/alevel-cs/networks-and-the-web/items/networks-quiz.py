import math

from learnsdk import MCQ, Multi, Numeric, QuizItem, TextAnswer

PROTOCOLS = {
    "HTTP": "requesting and transferring web pages (unencrypted)",
    "HTTPS": "requesting and transferring web pages over an encrypted connection",
    "FTP": "transferring files between a client and a server",
    "SMTP": "sending email, from a client to a server or between mail servers",
}


class Item(QuizItem):
    title = "Check: networks and the web"
    pass_mark = 0.7

    def questions(self):
        qs = []

        # --- 1. Packet count from file size and payload size (Numeric). ---
        payload = self.rng.choice([500, 1000, 1500])
        packets_wanted = self.rng.randint(3, 9)
        extra = self.rng.randint(1, payload - 1)
        file_size = payload * (packets_wanted - 1) + extra
        needed = math.ceil(file_size / payload)
        qs.append(Numeric(
            text=(
                f"A file of {file_size} bytes is sent using packet switching, "
                f"where each packet can carry a maximum payload of {payload} "
                "bytes. How many packets are needed to send the whole file?"
            ),
            answer=needed,
            tolerance=0,
            explanation=(
                f"$\\lceil {file_size}/{payload} \\rceil = {needed}$ packets — "
                "the file doesn't divide evenly, so the final packet carries "
                "the leftover bytes and is not full."
            ),
        ))

        # --- 2. Protocol purpose (MCQ). ---
        proto = self.rng.choice(list(PROTOCOLS.keys()))
        correct_purpose = PROTOCOLS[proto]
        choices = list(PROTOCOLS.values())
        self.rng.shuffle(choices)
        answer_idx = choices.index(correct_purpose)
        qs.append(MCQ(
            text=f"What is **{proto}** primarily used for?",
            choices=[c[0].upper() + c[1:] for c in choices],
            answer=answer_idx,
            explanation=f"**{proto}** is used for {correct_purpose}.",
        ))

        # --- 3. Topology behaviour on failure (MCQ, star or bus). ---
        topology = self.rng.choice(["star", "bus"])
        if topology == "star":
            correct = (
                "Every device loses the ability to communicate, since all "
                "traffic passes through it"
            )
            others = [
                "Only the device that was talking to that node is affected",
                "The network automatically forms a full mesh instead",
                "The remaining devices continue to communicate as normal",
            ]
            prompt = "the central switch in a **star** topology fails"
        else:
            correct = (
                "The whole network (or a whole section of it) can stop "
                "working, since every device shares a single cable"
            )
            others = [
                "Only the two devices nearest the break are affected",
                "The network automatically reroutes around the break",
                "Nothing changes, because bus networks have no single point "
                "of failure",
            ]
            prompt = "the shared cable in a **bus** topology breaks"
        choices = [correct] + others
        self.rng.shuffle(choices)
        answer_idx = choices.index(correct)
        qs.append(MCQ(
            text=f"What typically happens if {prompt}?",
            choices=choices,
            answer=answer_idx,
            explanation=f"In a {topology} topology, {correct[0].lower() + correct[1:]}.",
        ))

        # --- 4. TCP vs IP roles (Multi). ---
        statements = [
            ("TCP breaks data into segments and reassembles them in the "
             "correct order at the destination", True),
            ("IP is responsible for addressing devices and routing packets "
             "between networks", True),
            ("TCP arranges for a segment to be resent if it is lost or "
             "arrives corrupted", True),
            ("IP guarantees that packets always arrive in the order they "
             "were sent", False),
        ]
        self.rng.shuffle(statements)
        answers = [i for i, (_, is_true) in enumerate(statements) if is_true]
        qs.append(Multi(
            text="Which of the following statements about TCP and IP are correct?",
            choices=[s for s, _ in statements],
            answers=answers,
            explanation=(
                "TCP handles segmentation, reliable delivery (retransmitting "
                "lost/corrupted segments) and reassembly into the correct "
                "order. IP handles addressing and routing between networks, "
                "but on its own gives no guarantee that packets arrive in "
                "order — that ordering guarantee comes from TCP, not IP."
            ),
        ))

        # --- 5. DNS purpose (TextAnswer). ---
        qs.append(TextAnswer(
            text=(
                "Which system translates a domain name such as "
                "'www.example.com' into the IP address needed to actually "
                "contact the server? (Name it.)"
            ),
            accept=["DNS", "(the )?domain name system"],
            case_sensitive=False,
            explanation=(
                "**DNS (Domain Name System)** performs this translation, "
                "acting like a phone book for the Internet."
            ),
        ))

        return qs
