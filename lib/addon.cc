#include "./wrapped_re2.h"


using v8::Function;
using v8::FunctionTemplate;
using v8::Handle;
using v8::Local;
using v8::Object;
using v8::ObjectTemplate;
using v8::Persistent;


Persistent<Function> WrappedRE2::constructor;


void WrappedRE2::Initialize(Handle<Object> exports, Handle<Object> module) {

	// prepare constructor template
	Local<FunctionTemplate> tpl = NanNew<FunctionTemplate>(New);
	tpl->SetClassName(NanNew("RE2"));
	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	// prototype

	NODE_SET_PROTOTYPE_METHOD(tpl, "toString", ToString);

	NODE_SET_PROTOTYPE_METHOD(tpl, "exec",     Exec);
	NODE_SET_PROTOTYPE_METHOD(tpl, "test",     Test);

	NODE_SET_PROTOTYPE_METHOD(tpl, "match",    Match);
	NODE_SET_PROTOTYPE_METHOD(tpl, "replace",  Replace);
	NODE_SET_PROTOTYPE_METHOD(tpl, "search",   Search);
	NODE_SET_PROTOTYPE_METHOD(tpl, "split",    Split);

	Local<ObjectTemplate> proto = tpl->PrototypeTemplate();
	proto->SetAccessor(NanNew("source"),     GetSource);
	proto->SetAccessor(NanNew("global"),     GetGlobal);
	proto->SetAccessor(NanNew("ignoreCase"), GetIgnoreCase);
	proto->SetAccessor(NanNew("multiline"),  GetMultiline);
	proto->SetAccessor(NanNew("lastIndex"),  GetLastIndex, SetLastIndex);

	constructor = Persistent<Function>::New(tpl->GetFunction());

	// return constructor as module's export
	module->Set(NanNew("exports"), constructor);
}


void Initialize(Handle<Object> exports, Handle<Object> module) {
	WrappedRE2::Initialize(exports, module);
}


NODE_MODULE(re2, Initialize)
