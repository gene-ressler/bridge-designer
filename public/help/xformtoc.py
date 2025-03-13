import xml.etree.ElementTree as ET

def xform(tree, indent=' '):
  children = list(tree)  
  if children:
    print(f'{indent}<li>')
    print(f'{indent} <span class="folder">{tree.attrib.get('text')}</span>')
    print(f'{indent} <ul>')
    for child in children:
      xform(child, f'{indent}  ')
    print(f'{indent} </ul>')
    print(f'{indent}</li>')
  else:
    print(f'{indent}<li topic="{tree.attrib.get('target')}">{tree.attrib.get('text')}</li>')

tree = ET.parse('toc.xml')
print('<ul>')
xform(tree.getroot())
print('</ul>')

