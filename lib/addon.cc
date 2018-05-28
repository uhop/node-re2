#include "./wrapped_re2.h"

#include <node_buffer.h>


using v8::FunctionTemplate;
using v8::Integer;
using v8::Local;
using v8::MaybeLocal;
using v8::ObjectTemplate;
using v8::String;
using v8::Isolate;


Nan::Persistent<Function>         WrappedRE2::constructor;
Nan::Persistent<FunctionTemplate> WrappedRE2::ctorTemplate;


static NAN_METHOD(GetUtf8Length) {
	MaybeLocal<String> t(info[0]->ToString(Isolate::GetCurrent()->GetCurrentContext()));
	if (t.IsEmpty()) {
		return;
	}
	Local<String> s(t.ToLocalChecked());
	info.GetReturnValue().Set(static_cast<int>(s->Utf8Length()));
}


static NAN_METHOD(GetUtf16Length) {
	if (node::Buffer::HasInstance(info[0])) {
		char* s = node::Buffer::Data(info[0]);
		info.GetReturnValue().Set(static_cast<int>(getUtf16Length(s, s + node::Buffer::Length(info[0]))));
		return;
	}
	info.GetReturnValue().Set(-1);
}


void WrappedRE2::Initialize(Handle<Object> exports, Handle<Object> module) {

	// prepare constructor template
	Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);
	tpl->SetClassName(Nan::New("RE2").ToLocalChecked());
	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	// prototype

	Nan::SetPrototypeMethod(tpl, "toString", ToString);

	Nan::SetPrototypeMethod(tpl, "exec",     Exec);
	Nan::SetPrototypeMethod(tpl, "test",     Test);

	Nan::SetPrototypeMethod(tpl, "match",    Match);
	Nan::SetPrototypeMethod(tpl, "replace",  Replace);
	Nan::SetPrototypeMethod(tpl, "search",   Search);
	Nan::SetPrototypeMethod(tpl, "split",    Split);

	Local<ObjectTemplate> proto = tpl->PrototypeTemplate();
	Nan::SetAccessor(proto, Nan::New("source").ToLocalChecked(),     GetSource);
	Nan::SetAccessor(proto, Nan::New("global").ToLocalChecked(),     GetGlobal);
	Nan::SetAccessor(proto, Nan::New("ignoreCase").ToLocalChecked(), GetIgnoreCase);
	Nan::SetAccessor(proto, Nan::New("multiline").ToLocalChecked(),  GetMultiline);
	Nan::SetAccessor(proto, Nan::New("sticky").ToLocalChecked(),     GetSticky);
	Nan::SetAccessor(proto, Nan::New("lastIndex").ToLocalChecked(),  GetLastIndex, SetLastIndex);

	Local<Function> fun = Nan::GetFunction(tpl).ToLocalChecked();
	Nan::Export(fun, "getUtf8Length",  GetUtf8Length);
	Nan::Export(fun, "getUtf16Length", GetUtf16Length);
	constructor.Reset(fun);
	ctorTemplate.Reset(tpl);

	// return constructor as module's export
	Nan::Set(module, Nan::New("exports").ToLocalChecked(), fun);
}


void Initialize(Handle<Object> exports, Handle<Object> module) {
	WrappedRE2::Initialize(exports, module);
}


NODE_MODULE(re2, Initialize)
