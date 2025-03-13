from os import listdir
from os.path import isfile
from html.parser import HTMLParser
import re
import itertools

SKIP_TAGS = ["head", "html", "link", "meta"]


def attrsToStr(attrs):
    result = " ".join(f'{tag}="{value}"' for (tag, value) in attrs if tag not in ["border", "align"])
    return " " + result if result else ""


class MyHTMLParser(HTMLParser):
    def __init__(self, filename, *, convert_charrefs=True):
        super().__init__(convert_charrefs=convert_charrefs)
        self.topicTag = filename.removesuffix(".html")
        self.stack = []
        self.out = ""

    def clean_up(self):
        # Multiple spaces.
        self.out = re.sub(r'\s+', ' ', self.out)
        # Spaces after opening tags.
        self.out = re.sub(r'(<[^>]+>) ', r'\1', self.out)
        # Spaces before closing tags.
        self.out = re.sub(r' (</[^>]+>)', r'\1', self.out)
        # Re-insert spaces after in-line tags except if followed by punctuation.
        self.out = re.sub(r'(</(?:span|a)>)([^ .,;:)\]\-!%}])', r'\1 \2', self.out)
        

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            return
        if tag == "body":
            tag = "div"
            attrs.append(("id", self.topicTag))
        if tag == "object":
            self.stack.append((tag, attrs, {}))
            return
        if tag == "param":
            attrDict = dict(attrs)
            self.stack[-1][2][attrDict["name"]] = attrDict["value"]
            return
        if tag == "title":
            self.stack.append((tag,))
            return
        if tag == "a":
            attrDict = dict(attrs)
            # <a> tags in glossary have name rather than url. Let them alone.
            url = attrDict.get('href')
            if url:
                tag = "span"
                attrDict['topic'] = url.removesuffix(".html")
                del attrDict['href']
                self.stack.append(('a->span',))
            attrs = list(attrDict.items())
        if tag == 'area':
            attrDict = dict(attrs)
            href = attrDict.get('href')
            if href and href[0] != '#':
                attrDict['href'] = f"javascript:goToTopic('{href.removesuffix('.html')}')"
            attrs = list(attrDict.items())
        self.out += f"<{tag}{attrsToStr(attrs)}>"

    def handle_startendtag(self, tag, attrs):
        if tag in SKIP_TAGS:
            return
        if tag == "param":
            attrDict = dict(attrs)
            self.stack[-1][2][attrDict["name"]] = attrDict["value"]
            return
        self.out += f"<{tag}{attrsToStr(attrs)}>"

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS:
            return
        if tag == "body":
            tag = "div"
        if tag == "object":
            params = self.stack[-1][2]
            ref = params["content"].removesuffix(".html")
            self.out += f'<span glossary-ref="{ref}">{params['text']}</span>'
            self.stack.pop()
            return
        if tag == "title":
            self.stack.pop()
            return
        if tag == "a" and self.stack and self.stack[-1][0] == 'a->span':
            tag = "span"
            self.stack.pop()
        self.out += f"</{tag}>"

    def handle_data(self, data):
        data = data.replace("<", "&lt;").replace(">", "&gt;")
        if self.stack and self.stack[-1][0] in ["title"]:
            # h1 covers title info, so dump it
            return
        self.out += f"{data} "

    def handle_entityref(self, name):
        print(f"===ENTITY REF: {name}")

    def handle_charref(self, name):
        print(f"===CHAR REF: {name}")

    def handle_comment(self, data):
        print(f"===COMMENT: {data}")

    def handle_decl(self, data):
        if re.match(r".*DOCTYPE.*", data, re.IGNORECASE):
            return
        print(f"DECL: {data}")

    def unknown_decl(self, data):
        print(f"===UNKNOWN DECL: {data}")


filenames = list(listdir())
hlp = []
glos = []
for name in filenames:
    if not isfile(name) or not name.endswith(".html"):
        continue
    if name.startswith("hlp"):
        hlp.append(name)
    elif name.startswith("glos"):
        glos.append(name)
hlp.sort()
glos.sort()

for filename in itertools.chain(hlp, glos):
    with open(filename, "r") as file:
        fileContent = file.read()
        parser = MyHTMLParser(filename)
        parser.feed(fileContent)
        parser.clean_up()
        print(parser.out)
