#include "./wrapped_re2.h"


using v8::Integer;


NAN_GETTER(WrappedRE2::GetSource) {
	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(Nan::New(re2->regexp.pattern()).ToLocalChecked());
}


NAN_GETTER(WrappedRE2::GetGlobal) {
	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->global);
}


NAN_GETTER(WrappedRE2::GetIgnoreCase) {
	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->ignoreCase);
}


NAN_GETTER(WrappedRE2::GetMultiline) {
	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->multiline);
}


NAN_GETTER(WrappedRE2::GetLastIndex) {
	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(static_cast<int>(re2->lastIndex));
}


NAN_SETTER(WrappedRE2::SetLastIndex) {
	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (value->IsNumber()) {
		int n = value->NumberValue();
		re2->lastIndex = n <= 0 ? 0 : n;
	}
}
