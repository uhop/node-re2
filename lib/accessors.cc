#include "./wrapped_re2.h"


using v8::Integer;


NAN_GETTER(WrappedRE2::GetSource) {
	if (!WrappedRE2::HasInstance(info.This())) {
		info.GetReturnValue().Set(Nan::New("(?:)").ToLocalChecked());
		return;
	}

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(Nan::New(re2->regexp.pattern()).ToLocalChecked());
}


NAN_GETTER(WrappedRE2::GetGlobal) {
	if (!WrappedRE2::HasInstance(info.This())) {
		info.GetReturnValue().SetUndefined();
		return;
	}

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->global);
}


NAN_GETTER(WrappedRE2::GetIgnoreCase) {
	if (!WrappedRE2::HasInstance(info.This())) {
		info.GetReturnValue().SetUndefined();
		return;
	}

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->ignoreCase);
}


NAN_GETTER(WrappedRE2::GetMultiline) {
	if (!WrappedRE2::HasInstance(info.This())) {
		info.GetReturnValue().SetUndefined();
		return;
	}

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->multiline);
}


NAN_GETTER(WrappedRE2::GetSticky) {
	if (!WrappedRE2::HasInstance(info.This())) {
		info.GetReturnValue().SetUndefined();
		return;
	}

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->sticky);
}


NAN_GETTER(WrappedRE2::GetLastIndex) {
	if (!WrappedRE2::HasInstance(info.This())) {
		info.GetReturnValue().SetUndefined();
		return;
	}

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(static_cast<int>(re2->lastIndex));
}


NAN_SETTER(WrappedRE2::SetLastIndex) {
	if (!WrappedRE2::HasInstance(info.This())) {
		return Nan::ThrowTypeError("Cannot set lastIndex of an invalid RE2 object.");
	}

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (value->IsNumber()) {
		int n = value->NumberValue();
		re2->lastIndex = n <= 0 ? 0 : n;
	}
}
