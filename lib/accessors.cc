#include "./wrapped_re2.h"

#include <cstring>
#include <string>
#include <vector>

NAN_GETTER(WrappedRE2::GetSource)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().Set(Nan::New("(?:)").ToLocalChecked());
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(Nan::New(re2->source).ToLocalChecked());
}

NAN_GETTER(WrappedRE2::GetInternalSource)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().Set(Nan::New("(?:)").ToLocalChecked());
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(Nan::New(re2->regexp.pattern()).ToLocalChecked());
}

NAN_GETTER(WrappedRE2::GetFlags)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().Set(Nan::New("").ToLocalChecked());
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());

	std::string flags;
	if (re2->hasIndices)
	{
		flags += "d";
	}
	if (re2->global)
	{
		flags += "g";
	}
	if (re2->ignoreCase)
	{
		flags += "i";
	}
	if (re2->multiline)
	{
		flags += "m";
	}
	if (re2->dotAll)
	{
		flags += "s";
	}
	flags += "u";
	if (re2->sticky)
	{
		flags += "y";
	}

	info.GetReturnValue().Set(Nan::New(flags).ToLocalChecked());
}

NAN_GETTER(WrappedRE2::GetGlobal)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->global);
}

NAN_GETTER(WrappedRE2::GetIgnoreCase)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->ignoreCase);
}

NAN_GETTER(WrappedRE2::GetMultiline)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->multiline);
}

NAN_GETTER(WrappedRE2::GetDotAll)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->dotAll);
}

NAN_GETTER(WrappedRE2::GetUnicode)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	info.GetReturnValue().Set(true);
}

NAN_GETTER(WrappedRE2::GetSticky)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->sticky);
}

NAN_GETTER(WrappedRE2::GetHasIndices)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->hasIndices);
}

NAN_GETTER(WrappedRE2::GetLastIndex)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(static_cast<int>(re2->lastIndex));
}

NAN_SETTER(WrappedRE2::SetLastIndex)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		return Nan::ThrowTypeError("Cannot set lastIndex of an invalid RE2 object.");
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (value->IsNumber())
	{
		int n = value->NumberValue(Nan::GetCurrentContext()).FromMaybe(0);
		re2->lastIndex = n <= 0 ? 0 : n;
	}
}

WrappedRE2::UnicodeWarningLevels WrappedRE2::unicodeWarningLevel;

NAN_GETTER(WrappedRE2::GetUnicodeWarningLevel)
{
	std::string level;
	switch (unicodeWarningLevel)
	{
	case THROW:
		level = "throw";
		break;
	case WARN:
		level = "warn";
		break;
	case WARN_ONCE:
		level = "warnOnce";
		break;
	default:
		level = "nothing";
		break;
	}
	info.GetReturnValue().Set(Nan::New(level).ToLocalChecked());
}

NAN_SETTER(WrappedRE2::SetUnicodeWarningLevel)
{
	if (value->IsString())
	{
		Nan::Utf8String s(value);
		if (!strcmp(*s, "throw"))
		{
			unicodeWarningLevel = THROW;
			return;
		}
		if (!strcmp(*s, "warn"))
		{
			unicodeWarningLevel = WARN;
			return;
		}
		if (!strcmp(*s, "warnOnce"))
		{
			unicodeWarningLevel = WARN_ONCE;
			alreadyWarnedAboutUnicode = false;
			return;
		}
		if (!strcmp(*s, "nothing"))
		{
			unicodeWarningLevel = NOTHING;
			return;
		}
	}
}
