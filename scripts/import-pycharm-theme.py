"""Refresh the PyCharm color snapshot from an installed app; never needed at runtime."""
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parent.parent
app = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/Applications/PyCharm.app')
product_path = app / 'Contents/Resources/product-info.json'
product = json.loads(product_path.read_text())
jar_path = app / 'Contents/lib/intellij.platform.ide.impl.jar'
source = f"PyCharm {product['version']} ({product['buildNumber']}), bundled Islands Light / Islands Dark"
manifest = []
mapping = {}

with ZipFile(jar_path) as jar:
    def read(path):
        data = jar.read(path)
        manifest.append({'source': source, 'archive': 'Contents/lib/intellij.platform.ide.impl.jar', 'file': path, 'sha256': hashlib.sha256(data).hexdigest()})
        return data

    schemes = {s.get('name'): s for s in ET.fromstring(read('DefaultColorSchemesManager.xml')).findall('scheme')}
    for path in ['themes/islands/IslandSchemeDark.xml', 'themes/expUI/expUI_lightScheme.xml']:
        scheme = ET.fromstring(read(path))
        schemes[scheme.get('name')] = scheme

    def option(scheme, group, key, field=None):
        node = schemes[scheme].find(f"{group}/option[@name='{key}']")
        if node is not None:
            if field is None and node.get('value') is not None:
                return node.get('value')
            if field:
                value = node.find(f"value/option[@name='{field}']")
                if value is not None and value.get('value') is not None:
                    return value.get('value')
                if node.get('baseAttributes'):
                    return option(scheme, group, node.get('baseAttributes'), field)
                if node.find('value') is not None:
                    # A locally defined TextAttributes value replaces its parent's value.
                    # Missing FONT_TYPE is plain, not the parent's italic style.
                    return None
        parent = schemes[scheme].get('parent_scheme')
        return option(parent, group, key, field) if parent else None

    def color(scheme, group, key, field=None):
        value = option(scheme, group, key, field)
        if value is None:
            value = option(scheme, 'attributes', 'TEXT', 'FOREGROUND')
        return '#' + value.zfill(6).lower()

    ui_map = {
        'bg': 'main-window-bg', 'sidebar': 'tool-window-bg', 'panel': 'tool-window-bg',
        'surface': 'layer-1-bg', 'inset': 'editor-bg', 'hover': 'layer-2-bg',
        'border': 'control-border', 'border-strong': 'control-border-raised',
        'text': 'text-default', 'secondary': 'text-muted', 'muted': 'text-secondary',
        'accent': 'text-link', 'accent-fill': 'control-brand-bg', 'accent-ink': 'text-over-accent',
        'accent-soft': 'feedback-brand-bg', 'accent-border': 'feedback-brand-border',
        'warning-bg': 'feedback-warning-bg', 'warning': 'text-warning', 'warning-border': 'feedback-warning-border',
        'error-bg': 'feedback-error-bg', 'error': 'text-error',
        'success-bg': 'feedback-success-bg', 'success': 'text-success', 'success-border': 'feedback-success-border',
    }
    syntax_map = {
        'keyword':'DEFAULT_KEYWORD', 'control':'DEFAULT_KEYWORD', 'boolean':'DEFAULT_KEYWORD',
        'function':'DEFAULT_FUNCTION_DECLARATION', 'number':'DEFAULT_NUMBER', 'string':'DEFAULT_STRING',
        'comment':'DEFAULT_LINE_COMMENT', 'operator':'DEFAULT_OPERATION_SIGN',
        'variable':'DEFAULT_IDENTIFIER', 'definition':'DEFAULT_IDENTIFIER',
        'property':'DEFAULT_INSTANCE_FIELD', 'type':'DEFAULT_CLASS_REFERENCE',
    }
    palette = {'name':'PyCharm', 'source':source}
    for mode, ui_file, scheme in [
        ('light','themes/islands/ManyIslandsLight.theme.json','Light'),
        ('dark','themes/islands/ManyIslandsDark.theme.json','Islands Dark'),
    ]:
        ui = json.loads(read(ui_file))['colors']
        def resolve(key):
            while key in ui:
                key = ui[key]
            assert key.startswith('#') and len(key) == 7, key
            return key.lower()
        tokens = {key:resolve(value) for key,value in ui_map.items()}
        tokens.update({'syntax-'+key:color(scheme,'attributes',value,'FOREGROUND') for key,value in syntax_map.items()})
        tokens.update({
            'editor-text':color(scheme,'attributes','TEXT','FOREGROUND'),
            'editor-line':color(scheme,'colors','CARET_ROW_COLOR'),
            'editor-cursor':color(scheme,'colors','CARET_COLOR'),
            'selection':color(scheme,'colors','SELECTION_BACKGROUND'),
            'syntax-comment-style':'italic' if option(scheme,'attributes','DEFAULT_LINE_COMMENT','FONT_TYPE') == '2' else 'normal',
            'overlay':'#00000066' if mode == 'light' else '#000000b8',
            'shadow':'#00000018' if mode == 'light' else '#00000040',
            'radius-panel':'10px', 'radius-control':'6px', 'radius-card':'8px',
        })
        palette[mode] = tokens
        mapping[mode] = {
            'uiSource':ui_file, 'editorScheme':scheme,
            'uiTokens':ui_map,
            'syntaxAttributes':syntax_map,
            'fallback':'Missing syntax foregrounds resolve through baseAttributes and parent_scheme, then TEXT. Foreground hex strings are zero-padded to six digits.',
            'adaptations':'One function color covers declarations/calls in CodeMirror. Overlay, shadow and corner radii are ProCode treatments. Contrast changes are separately recorded.',
        }

# Full OLED snapshot, deliberately authored from the dark hue family rather than a vendor export.
oled = {**palette['dark']}
for key, value in list(oled.items()):
    if key.startswith('syntax-') and key != 'syntax-comment-style':
        oled[key] = '#' + ''.join(f'{round(int(value[i:i+2],16)*0.90):02x}' for i in [1,3,5])
oled.update({
    'bg':'#000000', 'sidebar':'#000000', 'panel':'#090a0c', 'surface':'#111316', 'inset':'#000000',
    'hover':'#1a1d22', 'border':'#282c33', 'border-strong':'#565c66',
    'text':'#c7c9cf', 'secondary':'#a1a4ad', 'muted':'#80858f',
    'accent':'#86aff7', 'accent-fill':'#17335f', 'accent-ink':'#cadbfa',
    'accent-soft':'#101b2d', 'accent-border':'#4269a4', 'selection':'#182740',
    'warning-bg':'#1d160c', 'warning':'#cfa65e', 'warning-border':'#65502c',
    'error-bg':'#200e12', 'error':'#e58a93',
    'success-bg':'#0b1b10', 'success':'#80b48d', 'success-border':'#315b3b',
    'editor-text':'#abadb4', 'editor-line':'#0b0d10', 'editor-cursor':'#b7bfcd',
    'overlay':'#000000d9', 'shadow':'#00000080',
})
palette['midnight'] = oled
palettes_path = root/'src/theme-palettes.json'
palettes = json.loads(palettes_path.read_text())
expected = set(palettes['procode']['dark'])
for mode in ['light','dark','midnight']:
    assert set(palette[mode]) == expected, (mode, expected.symmetric_difference(palette[mode]))
palettes['pycharm'] = palette
palettes_path.write_text(json.dumps(palettes,indent=2)+'\n')
manifest.append({'source':source,'file':'Contents/Resources/product-info.json','sha256':hashlib.sha256(product_path.read_bytes()).hexdigest()})
manifest_path = root/'docs/theme-source-manifest.json'
entries = [entry for entry in json.loads(manifest_path.read_text()) if not entry['source'].startswith('PyCharm ')]
manifest_path.write_text(json.dumps(entries+manifest,indent=2)+'\n')
(root/'docs/pycharm-token-map.json').write_text(json.dumps(mapping,indent=2)+'\n')
print(f'Imported {source}. Run npm run themes to generate CSS.')
