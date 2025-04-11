from html.parser import HTMLParser
import re
import pprint

DEBUG = False  # 'index'
TRIM = False

DONT_INDEX = """a
also
and
are
at
be
but
by
can
cant
for
in
is
it
its
of
on
or
that
the
to
use
using
was
will
when
which
with
you
your"""


def attrsToStr(attrs):
    result = " ".join(
        f'{tag}="{value}"' for (tag, value) in attrs if tag not in ["border", "align"]
    )
    return " " + result if result else ""


class Indexer(HTMLParser):
    def __init__(self, *, convert_charrefs=True):
        super().__init__(convert_charrefs=convert_charrefs)
        self.spaces = 0
        self.state = ""
        self.current_name = "[none]"
        self.current_title = "[none]"
        self.text = ""
        self.data = {}
        self.ignore_regex = "|".join(
            map(lambda w: f"\\b{w}\\b", DONT_INDEX.split("\n"))
        )

    def indent(self, *args):
        print(" " * self.spaces, *args)

    def handle_starttag(self, tag, attrs):
        if DEBUG == True:
            self.indent("start:", tag, attrsToStr(attrs))
            self.spaces += 1
        match tag:
            case "ng-template":
                self.current_name = dict(attrs).get("topic-name")
            case "h1":
                self.state = "in-title"
            case "p" | "span" | "li" | "topic-link" | "topic-popup":
                self.state = "in-text"

    def handle_endtag(self, tag):
        if DEBUG == True:
            self.spaces -= 1
            self.indent("end:", tag)
        match tag:
            case "ng-template":
                # collapse whitespace
                text = re.sub(r"\s+", " ", self.text)
                if TRIM:
                    # lowercase
                    text = text.lower()
                    # remove apostophes
                    text = re.sub(r"'", "", text)
                    # ignore uninteresting words
                    text = re.sub(self.ignore_regex, "", text)
                    # collapse whitespace finally
                    text = re.sub(r"\s+", " ", text)
                self.data[self.current_name] = (self.current_title, text.strip())
                self.text = ""

    def handle_startendtag(self, tag, attrs):
        if DEBUG == True:
            self.indent("start/end:", tag, attrsToStr(attrs))

    def handle_data(self, data):
        if DEBUG == True:
            self.indent("data:", data)
        # Remove HTML escapes.
        data = re.sub(r"&[^;]*;", " ", data.strip())
        if TRIM:
            data = re.sub(r"&[^;]*;|[-:,!();]|\.$|\. ", " ", data)
            data = re.sub(r"\s+", " ", data)
        if data == "":
            return
        match self.state:
            case "in-title":
                self.current_title = data
                self.state = 'in-text'
            case "in-text":
                self.text += " "
                self.text += data

    def handle_entityref(self, name):
        if DEBUG == True:
            self.indent("entity:", name)

    def handle_charref(self, name):
        if DEBUG == True:
            self.indent("charref:", name)

    def handle_comment(self, data):
        if DEBUG == True:
            self.indent("comment:", data)

    def handle_decl(self, decl):
        if DEBUG == True:
            self.indent("decl:", decl)

    def handle_pi(self, data):
        if DEBUG == True:
            self.indent("pi:", data)

    def unknown_decl(self, data):
        if DEBUG == True:
            self.indent("unknown:", data)


def quote(s):
    return f"`{s}`" if "'" in s else f"'{s}'"

PREAMBLE = """type HelpIndexData = {
  id: string,
  title: string,
  text: string,
};

export const HELP_INDEX_DATA: HelpIndexData[] = ["""

indexer = Indexer()
with open("../help-topic/help-topic.component.html", "r") as file:
    indexer.feed(file.read())

if DEBUG:
    pprint.pp(indexer.data)
else:
    with open("index-data.ts", "w") as f:
        print(PREAMBLE, file=f)
        chunk_size = 100
        for id, (title, text) in sorted(indexer.data.items()):
            text_chunks = [
                f"{quote(text[i:i + chunk_size])}"
                for i in range(0, len(text), chunk_size)
            ]
            print("  {", file=f)
            print(f"    id: '{id}',", file=f)
            print(f"    title: {quote(title)},", file=f)
            print(f"    text: {' +\n          '.join(text_chunks)}", file=f)
            print("  },", file=f)
        print("];", file=f)
