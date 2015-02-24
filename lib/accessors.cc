#include "./wrapped_re2.h"


using v8::Integer;


NAN_GETTER(WrappedRE2::GetSource) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	NanReturnValue(NanNew(re2->regexp.pattern()));
}


NAN_GETTER(WrappedRE2::GetGlobal) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	NanReturnValue(NanNew(re2->global));
}


NAN_GETTER(WrappedRE2::GetIgnoreCase) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	NanReturnValue(NanNew(re2->ignoreCase));
}


NAN_GETTER(WrappedRE2::GetMultiline) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	NanReturnValue(NanNew(re2->multiline));
}


NAN_GETTER(WrappedRE2::GetLastIndex) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	NanReturnValue(NanNew<Integer>(static_cast<int>(re2->lastIndex)));
}


NAN_SETTER(WrappedRE2::SetLastIndex) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (value->IsNumber()) {
		int n = value->NumberValue();
		re2->lastIndex = n <= 0 ? 0 : n;
	}
}
