#include "./wrapped_re2.h"


#include <string>


using std::string;


NAN_METHOD(WrappedRE2::ToString) {

	// unpack arguments

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2) {
		info.GetReturnValue().SetEmptyString();
		return;
	}

	// actual work

	string buffer("/");
	buffer += re2->regexp.pattern();
	buffer += "/";

	if (re2->ignoreCase) {
		buffer += "i";
	}
	if (re2->global) {
		buffer += "g";
	}
	if (re2->multiline) {
		buffer += "m";
	}

	info.GetReturnValue().Set(Nan::New(buffer).ToLocalChecked());
}
