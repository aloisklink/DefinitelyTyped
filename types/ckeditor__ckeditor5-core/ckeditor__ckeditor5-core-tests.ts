import {
    attachToForm,
    Command,
    Context,
    ContextPlugin,
    DataApiMixin,
    Editor,
    EditorUI,
    MultiCommand,
    PendingActions,
    Plugin,
} from '@ckeditor/ckeditor5-core';
import { EditorWithUI } from '@ckeditor/ckeditor5-core/src/editor/editorwithui';
import View from '@ckeditor/ckeditor5-ui/src/view';

let comm: Command;

/**
 * Editor
 */
class MyEditor extends Editor {
    source: string | HTMLElement;
    constructor(source: string | HTMLElement) {
        super();
        this.source = source;
    }
    static create(source: string | HTMLElement): Promise<MyEditor> {
        return new Promise(resolve => {
            const editor = new MyEditor(source);
            resolve(editor);
        });
    }
}

class MyUIEditor extends Editor implements EditorWithUI {
    source: string | HTMLElement;
    constructor(source: string | HTMLElement) {
        super();
        this.source = source;
    }
    ui: EditorUI;
    static create(source: string | HTMLElement): Promise<MyEditor> {
        return new Promise(resolve => {
            const editor = new MyEditor(source);
            resolve(editor);
        });
    }
}

const PluginArray: Array<typeof Plugin | typeof ContextPlugin | string> = MyEditor.builtinPlugins;
PluginArray.forEach(plugin => typeof plugin !== 'string' && plugin.pluginName);

const editor = new MyEditor(document.createElement('div'));
const editorState: 'initializing' | 'ready' | 'destroyed' = editor.state;
// $ExpectError
editor.state = editorState;
editor.focus();
editor.destroy().then(() => {});
editor.initPlugins().then(plugins => plugins.map(plugin => plugin.pluginName));

MyEditor.defaultConfig = {
    placeholder: 'foo',
};
// $ExpectError
MyEditor.defaultConfig = 4;
// $ExpectError
MyEditor.defaultConfig = { foo: 5 };

/**
 * Plugin
 */

class MyPlugin extends Plugin {
    get pluginName() {
        return 'MyPlugin';
    }

    myMethod() {
        return null;
    }
}

const myPlugin = new MyPlugin(editor);
const promise = myPlugin.init?.();
promise != null && promise.then(() => {});
myPlugin.myMethod();
myPlugin.isEnabled = true;
myPlugin.destroy();
// $ExpectType Editor | EditorWithUI
myPlugin.editor;
const myUIEditor = new MyPlugin(new MyUIEditor('')).editor;
if ('ui' in myUIEditor) {
    myUIEditor.ui; // $ExpectType EditorUI
}

/**
 * PluginCollection
 */
editor.plugins.get(MyPlugin).myMethod();
(editor.plugins.get('MyPlugin') as MyPlugin).myMethod();
// $ExpectType boolean
editor.plugins.has('foo');
// $ExpectType boolean
editor.plugins.has(MyPlugin);
// $ExpectError
editor.plugins.has(class Foo {});

// $ExpectError
editor.plugins.get(class Foo {});
editor.plugins.get(class Foo extends Plugin {});

class MyEmptyEditor extends Editor {
    static builtinPlugins = [MyPlugin];
}

/**
 * Command
 */
const command = new Command(new MyEmptyEditor());
command.execute();
command.execute('foo', 'bar', true, false, 50033);
command.execute(4545454, 'refresh', [], []);
command.execute({}, { foo: 5 });
// $ExpectType Editor
command.editor;
// $ExpectType boolean
command.isEnabled;
// $ExpectError
command.isEnabled = false;

comm = new Command(editor);

command.destroy();

command.execute();

command.refresh();

// $ExpectType unknown
command.value;
// $ExpectError
command.value = false;
delete command.value;

// $ExpectError
delete command.isEnabled;

// $ExpectType boolean
command.affectsData;

class MyCommand extends Command {
    get value(): boolean {
        return this.value;
    }
    protected set value(val: boolean) {
        this.value = val;
    }
    refresh() {
        this.value = false;
    }
}

// $ExpectType boolean
new MyCommand(editor).value;

/**
 * Context
 */

const context = new Context();
const contextWithConfig = new Context({ foo: 'foo' });
context.destroy().then(() => {});
contextWithConfig.initPlugins().then(plugins => plugins.map(plugin => plugin.pluginName));

/**
 * ContextPlugin
 */
class CPlugin extends ContextPlugin {}
// $ExpectError
class CPlugin2 extends ContextPlugin {
    static requires: [MyPlugin];
}
// $ExpectType true
CPlugin.isContextPlugin;
const afterInitPromise = new CPlugin(context).afterInit?.();
if (afterInitPromise != null) {
    afterInitPromise.then(() => {});
}

class MyCPlugin extends ContextPlugin {
    get pluginName() {
        return 'MyCPlugin';
    }

    builtinPlugins: [MyPlugin];
    myCMethod() {
        return null;
    }
}

editor.plugins.get(MyCPlugin).myCMethod();
(editor.plugins.get('MyCPlugin') as MyCPlugin).myCMethod();

context.plugins.get(MyCPlugin).myCMethod();
(context.plugins.get('MyCPlugin') as MyCPlugin).myCMethod();

/**
 * DataApiMixin
 */

DataApiMixin.setData('foo');
// $ExpectError
DataApiMixin.getData('foo');
DataApiMixin.getData({ rootName: 'foo' });
DataApiMixin.getData({ rootName: 'foo', trim: 'none' });

/**
 * attachToForm
 */
// $ExpectError
attachToForm();
attachToForm(editor);

/**
 * MultiCommand
 */
const MC = new MultiCommand(editor);
MC.registerChildCommand(comm);

/* EditorUI */
new EditorUI(editor).componentFactory.editor === editor;
new EditorUI(editor).componentFactory.add('', locale => new View(locale));
new EditorUI(editor).set('foo', true);
// $ExpectType { top: number; right: number; bottom: number; left: number; }
new EditorUI(editor).viewportOffset;

/** Pending Actions */
// $ExpectType boolean
new PendingActions(context).hasAny;
// $ExpectError
new PendingActions(context).hasAny = true;
new PendingActions(context).remove(new PendingActions(context).add(''));

// $ExpectType PendingActions
new MyEditor('').plugins.get('PendingActions');
// $ExpectType PendingActions
new MyEditor('').plugins.get(PendingActions);
