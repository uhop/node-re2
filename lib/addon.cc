#include "./wrapped_re2.h"

#include <node_buffer.h>

Nan::Persistent<v8::Function> WrappedRE2::constructor;
Nan::Persistent<v8::FunctionTemplate> WrappedRE2::ctorTemplate;

static NAN_METHOD(GetUtf8Length)
{
	auto isolate = v8::Isolate::GetCurrent();
	auto t = info[0]->ToString(isolate->GetCurrentContext());
	if (t.IsEmpty())
	{
		return;
	}
	auto s = t.ToLocalChecked();
	info.GetReturnValue().Set(static_cast<int>(s->Utf8Length(isolate)));
}

static NAN_METHOD(GetUtf16Length)
{
	if (node::Buffer::HasInstance(info[0]))
	{
		const auto *s = node::Buffer::Data(info[0]);
		info.GetReturnValue().Set(static_cast<int>(getUtf16Length(s, s + node::Buffer::Length(info[0]))));
		return;
	}
	info.GetReturnValue().Set(-1);
}

void WrappedRE2::Initialize(v8::Local<v8::Object> exports, v8::Local<v8::Object> module)
{

	// prepare constructor template
	auto tpl = Nan::New<v8::FunctionTemplate>(New);
	tpl->SetClassName(Nan::New("RE2").ToLocalChecked());
	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	// prototype

	Nan::SetPrototypeMethod(tpl, "toString", ToString);

	Nan::SetPrototypeMethod(tpl, "exec", Exec);
	Nan::SetPrototypeMethod(tpl, "test", Test);

	Nan::SetPrototypeMethod(tpl, "match", Match);
	Nan::SetPrototypeMethod(tpl, "replace", Replace);
	Nan::SetPrototypeMethod(tpl, "search", Search);
	Nan::SetPrototypeMethod(tpl, "split", Split);

	auto proto = tpl->PrototypeTemplate();
	Nan::SetAccessor(proto, Nan::New("source").ToLocalChecked(), GetSource);
	Nan::SetAccessor(proto, Nan::New("flags").ToLocalChecked(), GetFlags);
	Nan::SetAccessor(proto, Nan::New("global").ToLocalChecked(), GetGlobal);
	Nan::SetAccessor(proto, Nan::New("ignoreCase").ToLocalChecked(), GetIgnoreCase);
	Nan::SetAccessor(proto, Nan::New("multiline").ToLocalChecked(), GetMultiline);
	Nan::SetAccessor(proto, Nan::New("unicode").ToLocalChecked(), GetUnicode);
	Nan::SetAccessor(proto, Nan::New("sticky").ToLocalChecked(), GetSticky);
	Nan::SetAccessor(proto, Nan::New("lastIndex").ToLocalChecked(), GetLastIndex, SetLastIndex);
	Nan::SetAccessor(proto, Nan::New("internalSource").ToLocalChecked(), GetInternalSource);

	auto fun = Nan::GetFunction(tpl).ToLocalChecked();
	Nan::Export(fun, "getUtf8Length", GetUtf8Length);
	Nan::Export(fun, "getUtf16Length", GetUtf16Length);
	Nan::SetAccessor(v8::Local<v8::Object>(fun), Nan::New("unicodeWarningLevel").ToLocalChecked(), GetUnicodeWarningLevel, SetUnicodeWarningLevel);
	constructor.Reset(fun);
	ctorTemplate.Reset(tpl);

	// return constructor as module's export
	Nan::Set(module, Nan::New("exports").ToLocalChecked(), fun);
}

void Initialize(v8::Local<v8::Object> exports, v8::Local<v8::Object> module)
{
	WrappedRE2::Initialize(exports, module);
}

NODE_MODULE(re2, Initialize)
