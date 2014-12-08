#include "./wrapped_re2.h"


#include <string>


using std::string;


NAN_METHOD(WrappedRE2::ToString) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnEmptyString();
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

	NanReturnValue(NanNew(buffer));
}
