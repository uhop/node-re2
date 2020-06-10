#include "./wrapped_re2.h"

#include <string>

NAN_METHOD(WrappedRE2::ToString)
{

	// unpack arguments

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		info.GetReturnValue().SetEmptyString();
		return;
	}

	// actual work

	std::string buffer("/");
	buffer += re2->source;
	buffer += "/";

	if (re2->global)
	{
		buffer += "g";
	}
	if (re2->ignoreCase)
	{
		buffer += "i";
	}
	if (re2->multiline)
	{
		buffer += "m";
	}
	buffer += "u";
	if (re2->sticky)
	{
		buffer += "y";
	}

	info.GetReturnValue().Set(Nan::New(buffer).ToLocalChecked());
}
