#include "./wrapped_re2.h"


using v8::Function;
using v8::FunctionTemplate;
using v8::Handle;
using v8::Integer;
using v8::Local;
using v8::Object;
using v8::ObjectTemplate;
using v8::Persistent;
using v8::String;


Persistent<Function> WrappedRE2::constructor;


static NAN_METHOD(GetUtf8Length) {
	NanScope();

	String::Value s(args[0]->ToString());

	size_t n = 0;
	for (size_t i = 0, l = s.length(); i < l; ++i) {
		uint16_t ch = (*s)[i];
		if (ch <= 0x7F) ++n;
		else if (ch <= 0x7FF) n += 2;
		else if (0xD800 <= ch && ch <= 0xDFFF) n += 4;
		else if (ch < 0xFFFF) n += 3;
		else n += 4;
	}

	NanReturnValue(NanNew<Integer>(n));
}


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
	constructor->Set(NanNew("getUtf8Length"), NanNew<FunctionTemplate>(GetUtf8Length)->GetFunction());

	// return constructor as module's export
	module->Set(NanNew("exports"), constructor);
}


void Initialize(Handle<Object> exports, Handle<Object> module) {
	WrappedRE2::Initialize(exports, module);
}


NODE_MODULE(re2, Initialize)
