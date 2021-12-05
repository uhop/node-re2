#include "./wrapped_re2.h"
#include "./util.h"

#include <vector>

#include <node_buffer.h>

NAN_METHOD(WrappedRE2::Test)
{

	// unpack arguments

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		info.GetReturnValue().Set(false);
		return;
	}

	StrVal str = info[0];
	if (!str.data)
	{
		return;
	}

	size_t lastIndex = 0;

	if (str.isBuffer)
	{
		if ((re2->global || re2->sticky) && re2->lastIndex)
		{
			if (re2->lastIndex > str.size)
			{
				re2->lastIndex = 0;
				info.GetReturnValue().Set(false);
				return;
			}
			lastIndex = re2->lastIndex;
		}
	}
	else
	{
		if ((re2->global || re2->sticky) && re2->lastIndex)
		{
			if (re2->lastIndex > str.length)
			{
				re2->lastIndex = 0;
				info.GetReturnValue().Set(false);
				return;
			}
			for (size_t n = re2->lastIndex; n; --n)
			{
				size_t s = getUtf8CharSize(str.data[lastIndex]);
				lastIndex += s;
				if (s == 4 && n >= 2) --n; // this utf8 character will take two utf16 characters
				// the decrement above is protected to avoid an overflow of an unsigned integer
			}
		}
	}

	// actual work

	if (re2->global || re2->sticky)
	{
		re2::StringPiece match;
		if (re2->regexp.Match(str, lastIndex, str.size, re2->sticky ? re2::RE2::ANCHOR_START : re2::RE2::UNANCHORED, &match, 1))
		{
			re2->lastIndex += str.isBuffer ? match.data() - str.data + match.size() - lastIndex : getUtf16Length(str.data + lastIndex, match.data() + match.size());
			info.GetReturnValue().Set(true);
			return;
		}
		re2->lastIndex = 0;
		info.GetReturnValue().Set(false);
		return;
	}

	info.GetReturnValue().Set(re2->regexp.Match(str, lastIndex, str.size, re2::RE2::UNANCHORED, NULL, 0));
}
