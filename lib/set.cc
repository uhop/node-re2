#include "./wrapped_re2_set.h"
#include "./pattern.h"
#include "./util.h"
#include "./wrapped_re2.h"

#include <algorithm>
#include <memory>
#include <string>
#include <vector>

Nan::Persistent<v8::FunctionTemplate> WrappedRE2Set::constructor;

struct SetFlags
{
	bool global = false;
	bool ignoreCase = false;
	bool multiline = false;
	bool dotAll = false;
	bool unicode = false;
	bool sticky = false;
	bool hasIndices = false;
};

static bool parseFlags(const v8::Local<v8::Value> &arg, SetFlags &flags)
{
	const char *data = nullptr;
	size_t size = 0;
	std::vector<char> buffer;

	if (arg->IsString())
	{
		auto isolate = v8::Isolate::GetCurrent();
		auto t = arg->ToString(Nan::GetCurrentContext());
		if (t.IsEmpty())
		{
			return false;
		}
		auto s = t.ToLocalChecked();
		size = s->Utf8Length(isolate);
		buffer.resize(size + 1);
		s->WriteUtf8(isolate, &buffer[0], buffer.size());
		buffer[buffer.size() - 1] = '\0';
		data = &buffer[0];
	}
	else if (node::Buffer::HasInstance(arg))
	{
		size = node::Buffer::Length(arg);
		data = node::Buffer::Data(arg);
	}
	else
	{
		return false;
	}

	for (size_t i = 0; i < size; ++i)
	{
		switch (data[i])
		{
		case 'd':
			flags.hasIndices = true;
			break;
		case 'g':
			flags.global = true;
			break;
		case 'i':
			flags.ignoreCase = true;
			break;
		case 'm':
			flags.multiline = true;
			break;
		case 's':
			flags.dotAll = true;
			break;
		case 'u':
			flags.unicode = true;
			break;
		case 'y':
			flags.sticky = true;
			break;
		default:
			return false;
		}
	}

	return true;
}

static bool sameEffectiveOptions(const SetFlags &a, const SetFlags &b)
{
	return a.ignoreCase == b.ignoreCase && a.multiline == b.multiline && a.dotAll == b.dotAll && a.unicode == b.unicode;
}

static std::string flagsToString(const SetFlags &flags)
{
	std::string result;
	if (flags.hasIndices)
	{
		result += 'd';
	}
	if (flags.global)
	{
		result += 'g';
	}
	if (flags.ignoreCase)
	{
		result += 'i';
	}
	if (flags.multiline)
	{
		result += 'm';
	}
	if (flags.dotAll)
	{
		result += 's';
	}
	result += 'u';
	if (flags.sticky)
	{
		result += 'y';
	}
	return result;
}

static bool collectIterable(const v8::Local<v8::Value> &input, std::vector<v8::Local<v8::Value>> &items)
{
	auto context = Nan::GetCurrentContext();
	auto isolate = v8::Isolate::GetCurrent();

	if (input->IsArray())
	{
		auto array = v8::Local<v8::Array>::Cast(input);
		auto length = array->Length();
		items.reserve(length);
		for (uint32_t i = 0; i < length; ++i)
		{
			auto maybe = Nan::Get(array, i);
			if (maybe.IsEmpty())
			{
				return false;
			}
			items.push_back(maybe.ToLocalChecked());
		}
		return true;
	}

	auto maybeObject = input->ToObject(context);
	if (maybeObject.IsEmpty())
	{
		return false;
	}
	auto object = maybeObject.ToLocalChecked();

	auto maybeIteratorFn = object->Get(context, v8::Symbol::GetIterator(isolate));
	if (maybeIteratorFn.IsEmpty())
	{
		return false;
	}
	auto iteratorFn = maybeIteratorFn.ToLocalChecked();
	if (!iteratorFn->IsFunction())
	{
		return false;
	}

	auto maybeIterator = iteratorFn.As<v8::Function>()->Call(context, object, 0, nullptr);
	if (maybeIterator.IsEmpty())
	{
		return false;
	}
	auto iterator = maybeIterator.ToLocalChecked();
	if (!iterator->IsObject())
	{
		return false;
	}

	auto nextKey = Nan::New("next").ToLocalChecked();
	auto valueKey = Nan::New("value").ToLocalChecked();
	auto doneKey = Nan::New("done").ToLocalChecked();

	for (;;)
	{
		auto maybeNext = Nan::Get(iterator.As<v8::Object>(), nextKey);
		if (maybeNext.IsEmpty())
		{
			return false;
		}
		auto next = maybeNext.ToLocalChecked();
		if (!next->IsFunction())
		{
			return false;
		}
		auto maybeResult = next.As<v8::Function>()->Call(context, iterator, 0, nullptr);
		if (maybeResult.IsEmpty())
		{
			return false;
		}
		auto result = maybeResult.ToLocalChecked();
		if (!result->IsObject())
		{
			return false;
		}
		auto resultObj = result->ToObject(context).ToLocalChecked();
		auto maybeDone = Nan::Get(resultObj, doneKey);
		if (maybeDone.IsEmpty())
		{
			return false;
		}
		if (maybeDone.ToLocalChecked()->BooleanValue(isolate))
		{
			break;
		}
		auto maybeValue = Nan::Get(resultObj, valueKey);
		if (maybeValue.IsEmpty())
		{
			return false;
		}
		items.push_back(maybeValue.ToLocalChecked());
	}

	return true;
}

static bool parseAnchor(const v8::Local<v8::Value> &arg, re2::RE2::Anchor &anchor)
{
	if (arg.IsEmpty() || arg->IsUndefined() || arg->IsNull())
	{
		anchor = re2::RE2::UNANCHORED;
		return true;
	}

	v8::Local<v8::Value> value = arg;
	if (arg->IsObject() && !arg->IsString())
	{
		auto context = Nan::GetCurrentContext();
		auto object = arg->ToObject(context).ToLocalChecked();
		auto maybeAnchor = Nan::Get(object, Nan::New("anchor").ToLocalChecked());
		if (maybeAnchor.IsEmpty())
		{
			return false;
		}
		value = maybeAnchor.ToLocalChecked();
		if (value->IsUndefined() || value->IsNull())
		{
			anchor = re2::RE2::UNANCHORED;
			return true;
		}
	}

	if (!value->IsString())
	{
		return false;
	}

	Nan::Utf8String val(value);
	std::string text(*val, val.length());

	if (text == "unanchored")
	{
		anchor = re2::RE2::UNANCHORED;
		return true;
	}
	if (text == "start")
	{
		anchor = re2::RE2::ANCHOR_START;
		return true;
	}
	if (text == "both")
	{
		anchor = re2::RE2::ANCHOR_BOTH;
		return true;
	}

	return false;
}

static bool fillInput(const v8::Local<v8::Value> &arg, StrVal &str, v8::Local<v8::Object> &keepAlive)
{
	if (node::Buffer::HasInstance(arg))
	{
		auto size = node::Buffer::Length(arg);
		str.reset(arg, size, size, 0, true);
		return true;
	}

	auto context = Nan::GetCurrentContext();
	auto isolate = v8::Isolate::GetCurrent();
	auto t = arg->ToString(context);
	if (t.IsEmpty())
	{
		return false;
	}
	auto s = t.ToLocalChecked();
	auto utf8Length = s->Utf8Length(isolate);
	auto buffer = node::Buffer::New(isolate, s).ToLocalChecked();
	keepAlive = buffer;
	str.reset(buffer, node::Buffer::Length(buffer), utf8Length, 0);
	return true;
}

static std::string anchorToString(re2::RE2::Anchor anchor)
{
	switch (anchor)
	{
	case re2::RE2::ANCHOR_BOTH:
		return "both";
	case re2::RE2::ANCHOR_START:
		return "start";
	default:
		return "unanchored";
	}
}

static std::string makeCombinedSource(const std::vector<std::string> &sources)
{
	if (sources.empty())
	{
		return "(?:)";
	}

	std::string combined;
	for (size_t i = 0, n = sources.size(); i < n; ++i)
	{
		if (i)
		{
			combined += '|';
		}
		combined += sources[i];
	}
	return combined;
}

static const char setDeprecationMessage[] = "BMP patterns aren't supported by node-re2. An implicit \"u\" flag is assumed by RE2.Set. In a future major version, calling RE2.Set without the \"u\" flag may become forbidden, or cause a different behavior. Please see https://github.com/uhop/node-re2/issues/21 for more information.";

NAN_METHOD(WrappedRE2Set::New)
{
	auto context = Nan::GetCurrentContext();
	auto isolate = context->GetIsolate();

	if (!info.IsConstructCall())
	{
		std::vector<v8::Local<v8::Value>> parameters(info.Length());
		for (size_t i = 0, n = info.Length(); i < n; ++i)
		{
			parameters[i] = info[i];
		}
		auto maybeNew = Nan::NewInstance(Nan::GetFunction(Nan::New(constructor)).ToLocalChecked(), parameters.size(), &parameters[0]);
		if (!maybeNew.IsEmpty())
		{
			info.GetReturnValue().Set(maybeNew.ToLocalChecked());
		}
		return;
	}

	if (!info.Length())
	{
		return Nan::ThrowTypeError("Expected an iterable of patterns as the 1st argument.");
	}

	SetFlags flags;
	bool haveFlags = false;
	bool flagsFromArg = false;

	v8::Local<v8::Value> flagsArg;
	v8::Local<v8::Value> optionsArg;
	if (info.Length() > 1)
	{
		if (info[1]->IsObject() && !info[1]->IsString() && !node::Buffer::HasInstance(info[1]))
		{
			optionsArg = info[1];
		}
		else
		{
			flagsArg = info[1];
			if (info.Length() > 2)
			{
				optionsArg = info[2];
			}
		}
	}

	if (!flagsArg.IsEmpty())
	{
		if (!parseFlags(flagsArg, flags))
		{
			return Nan::ThrowTypeError("Invalid flags for RE2.Set.");
		}
		haveFlags = true;
		flagsFromArg = true;
	}

	re2::RE2::Anchor anchor = re2::RE2::UNANCHORED;
	if (!optionsArg.IsEmpty())
	{
		if (!parseAnchor(optionsArg, anchor))
		{
			return Nan::ThrowTypeError("Invalid anchor option for RE2.Set.");
		}
	}

	std::vector<v8::Local<v8::Value>> patterns;
	if (!collectIterable(info[0], patterns))
	{
		return Nan::ThrowTypeError("Expected an iterable of patterns as the 1st argument.");
	}

	auto mergeFlags = [&](const SetFlags &candidate) {
		if (flagsFromArg)
		{
			return true;
		}
		if (!haveFlags)
		{
			flags = candidate;
			haveFlags = true;
			return true;
		}
		return sameEffectiveOptions(flags, candidate);
	};

	for (auto &value : patterns)
	{
		SetFlags patternFlags;
		bool hasFlagsForPattern = false;

		if (value->IsRegExp())
		{
			const auto *re = v8::RegExp::Cast(*value);
			v8::RegExp::Flags reFlags = re->GetFlags();
			patternFlags.global = bool(reFlags & v8::RegExp::kGlobal);
			patternFlags.ignoreCase = bool(reFlags & v8::RegExp::kIgnoreCase);
			patternFlags.multiline = bool(reFlags & v8::RegExp::kMultiline);
			patternFlags.dotAll = bool(reFlags & v8::RegExp::kDotAll);
			patternFlags.unicode = bool(reFlags & v8::RegExp::kUnicode);
			patternFlags.sticky = bool(reFlags & v8::RegExp::kSticky);
			patternFlags.hasIndices = bool(reFlags & v8::RegExp::kHasIndices);
			hasFlagsForPattern = true;
		}
		else if (value->IsObject())
		{
			auto maybeObj = value->ToObject(context);
			if (!maybeObj.IsEmpty())
			{
				auto obj = maybeObj.ToLocalChecked();
				if (WrappedRE2::HasInstance(obj))
				{
					auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(obj);
					patternFlags.global = re2->global;
					patternFlags.ignoreCase = re2->ignoreCase;
					patternFlags.multiline = re2->multiline;
					patternFlags.dotAll = re2->dotAll;
					patternFlags.unicode = true;
					patternFlags.sticky = re2->sticky;
					patternFlags.hasIndices = re2->hasIndices;
					hasFlagsForPattern = true;
				}
			}
		}

		if (hasFlagsForPattern && !mergeFlags(patternFlags))
		{
			return Nan::ThrowTypeError("All patterns in RE2.Set must use the same flags.");
		}
	}

	if (!flags.unicode)
	{
		switch (WrappedRE2::unicodeWarningLevel)
		{
	case WrappedRE2::THROW:
			return Nan::ThrowSyntaxError(setDeprecationMessage);
		case WrappedRE2::WARN:
			printDeprecationWarning(setDeprecationMessage);
			break;
		case WrappedRE2::WARN_ONCE:
			if (!WrappedRE2::alreadyWarnedAboutUnicode)
			{
				printDeprecationWarning(setDeprecationMessage);
				WrappedRE2::alreadyWarnedAboutUnicode = true;
			}
			break;
		default:
			break;
		}
	}

	re2::RE2::Options options;
	options.set_case_sensitive(!flags.ignoreCase);
	options.set_one_line(!flags.multiline);
	options.set_dot_nl(flags.dotAll);
	options.set_log_errors(false);

	std::unique_ptr<WrappedRE2Set> set(new WrappedRE2Set(options, anchor, flagsToString(flags)));
	std::vector<char> buffer;

	for (auto &value : patterns)
	{
		const char *data = nullptr;
		size_t size = 0;
		std::string source;

		if (node::Buffer::HasInstance(value))
		{
			size = node::Buffer::Length(value);
			data = node::Buffer::Data(value);
			source = escapeRegExp(data, size);
		}
		else if (value->IsRegExp())
		{
			const auto *re = v8::RegExp::Cast(*value);
			auto t = re->GetSource()->ToString(context);
			if (t.IsEmpty())
			{
				return;
			}
			auto s = t.ToLocalChecked();
			size = s->Utf8Length(isolate);
			buffer.resize(size + 1);
			s->WriteUtf8(isolate, &buffer[0], buffer.size());
			buffer[size] = '\0';
			data = &buffer[0];
			source = escapeRegExp(data, size);
		}
		else if (value->IsString())
		{
			auto t = value->ToString(context);
			if (t.IsEmpty())
			{
				return;
			}
			auto s = t.ToLocalChecked();
			size = s->Utf8Length(isolate);
			buffer.resize(size + 1);
			s->WriteUtf8(isolate, &buffer[0], buffer.size());
			buffer[size] = '\0';
			data = &buffer[0];
			source = escapeRegExp(data, size);
		}
		else if (value->IsObject())
		{
			auto maybeObj = value->ToObject(context);
			if (maybeObj.IsEmpty())
			{
				return;
			}
			auto obj = maybeObj.ToLocalChecked();
			if (!WrappedRE2::HasInstance(obj))
			{
				return Nan::ThrowTypeError("Expected a string, Buffer, RegExp, or RE2 instance in the pattern list.");
			}

			auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(obj);
			source = re2->source;
			data = source.data();
			size = source.size();
		}
		else
		{
			return Nan::ThrowTypeError("Expected a string, Buffer, RegExp, or RE2 instance in the pattern list.");
		}

		if (translateRegExp(data, size, flags.multiline, buffer))
		{
			data = &buffer[0];
			size = buffer.size() - 1;
		}

		std::string error;
		if (set->set.Add(re2::StringPiece(data, size), &error) < 0)
		{
			if (error.empty())
			{
				error = "Invalid pattern in RE2.Set.";
			}
			return Nan::ThrowSyntaxError(error.c_str());
		}
		set->sources.push_back(source);
	}

	if (!set->set.Compile())
	{
		return Nan::ThrowError("RE2.Set could not be compiled.");
	}

	set->combinedSource = makeCombinedSource(set->sources);
	set->Wrap(info.This());
	set.release();

	info.GetReturnValue().Set(info.This());
}

NAN_METHOD(WrappedRE2Set::Test)
{
	auto re2set = Nan::ObjectWrap::Unwrap<WrappedRE2Set>(info.This());
	if (!re2set)
	{
		info.GetReturnValue().Set(false);
		return;
	}

	StrVal str;
	v8::Local<v8::Object> keepAlive;
	if (!fillInput(info[0], str, keepAlive))
	{
		return;
	}

	re2::RE2::Set::ErrorInfo errorInfo{re2::RE2::Set::kNoError};
	bool matched = re2set->set.Match(str, nullptr, &errorInfo);
	if (!matched && errorInfo.kind != re2::RE2::Set::kNoError)
	{
		const char *message = "RE2.Set matching failed.";
		switch (errorInfo.kind)
		{
		case re2::RE2::Set::kOutOfMemory:
			message = "RE2.Set matching failed: out of memory.";
			break;
		case re2::RE2::Set::kInconsistent:
			message = "RE2.Set matching failed: inconsistent result.";
			break;
		case re2::RE2::Set::kNotCompiled:
			message = "RE2.Set matching failed: set is not compiled.";
			break;
		default:
			break;
		}
		return Nan::ThrowError(message);
	}

	info.GetReturnValue().Set(matched);
}

NAN_METHOD(WrappedRE2Set::Match)
{
	auto re2set = Nan::ObjectWrap::Unwrap<WrappedRE2Set>(info.This());
	if (!re2set)
	{
		info.GetReturnValue().Set(Nan::New<v8::Array>(0));
		return;
	}

	StrVal str;
	v8::Local<v8::Object> keepAlive;
	if (!fillInput(info[0], str, keepAlive))
	{
		return;
	}

	std::vector<int> matches;
	re2::RE2::Set::ErrorInfo errorInfo{re2::RE2::Set::kNoError};
	bool matched = re2set->set.Match(str, &matches, &errorInfo);
	if (!matched && errorInfo.kind != re2::RE2::Set::kNoError)
	{
		const char *message = "RE2.Set matching failed.";
		switch (errorInfo.kind)
		{
		case re2::RE2::Set::kOutOfMemory:
			message = "RE2.Set matching failed: out of memory.";
			break;
		case re2::RE2::Set::kInconsistent:
			message = "RE2.Set matching failed: inconsistent result.";
			break;
		case re2::RE2::Set::kNotCompiled:
			message = "RE2.Set matching failed: set is not compiled.";
			break;
		default:
			break;
		}
		return Nan::ThrowError(message);
	}

	std::sort(matches.begin(), matches.end());
	auto result = Nan::New<v8::Array>(matches.size());
	for (size_t i = 0, n = matches.size(); i < n; ++i)
	{
		Nan::Set(result, i, Nan::New(matches[i]));
	}

	info.GetReturnValue().Set(result);
}

NAN_METHOD(WrappedRE2Set::ToString)
{
	auto re2set = Nan::ObjectWrap::Unwrap<WrappedRE2Set>(info.This());
	if (!re2set)
	{
		info.GetReturnValue().SetEmptyString();
		return;
	}

	std::string result = "/";
	result += re2set->combinedSource;
	result += "/";
	result += re2set->flags;
	info.GetReturnValue().Set(Nan::New(result).ToLocalChecked());
}

NAN_GETTER(WrappedRE2Set::GetFlags)
{
	auto re2set = Nan::ObjectWrap::Unwrap<WrappedRE2Set>(info.This());
	if (!re2set)
	{
		info.GetReturnValue().Set(Nan::New("u").ToLocalChecked());
		return;
	}
	info.GetReturnValue().Set(Nan::New(re2set->flags).ToLocalChecked());
}

NAN_GETTER(WrappedRE2Set::GetSources)
{
	auto re2set = Nan::ObjectWrap::Unwrap<WrappedRE2Set>(info.This());
	if (!re2set)
	{
		info.GetReturnValue().Set(Nan::New<v8::Array>(0));
		return;
	}
	auto result = Nan::New<v8::Array>(re2set->sources.size());
	for (size_t i = 0, n = re2set->sources.size(); i < n; ++i)
	{
		Nan::Set(result, i, Nan::New(re2set->sources[i]).ToLocalChecked());
	}
	info.GetReturnValue().Set(result);
}

NAN_GETTER(WrappedRE2Set::GetSource)
{
	auto re2set = Nan::ObjectWrap::Unwrap<WrappedRE2Set>(info.This());
	if (!re2set)
	{
		info.GetReturnValue().Set(Nan::New("(?:)").ToLocalChecked());
		return;
	}
	info.GetReturnValue().Set(Nan::New(re2set->combinedSource).ToLocalChecked());
}

NAN_GETTER(WrappedRE2Set::GetSize)
{
	auto re2set = Nan::ObjectWrap::Unwrap<WrappedRE2Set>(info.This());
	if (!re2set)
	{
		info.GetReturnValue().Set(0);
		return;
	}
	info.GetReturnValue().Set(static_cast<uint32_t>(re2set->sources.size()));
}

NAN_GETTER(WrappedRE2Set::GetAnchor)
{
	auto re2set = Nan::ObjectWrap::Unwrap<WrappedRE2Set>(info.This());
	if (!re2set)
	{
		info.GetReturnValue().Set(Nan::New("unanchored").ToLocalChecked());
		return;
	}
	info.GetReturnValue().Set(Nan::New(anchorToString(re2set->anchor)).ToLocalChecked());
}

v8::Local<v8::Function> WrappedRE2Set::Init()
{
	Nan::EscapableHandleScope scope;

	auto tpl = Nan::New<v8::FunctionTemplate>(New);
	tpl->SetClassName(Nan::New("RE2Set").ToLocalChecked());
	auto instanceTemplate = tpl->InstanceTemplate();
	instanceTemplate->SetInternalFieldCount(1);

	Nan::SetPrototypeMethod(tpl, "test", Test);
	Nan::SetPrototypeMethod(tpl, "match", Match);
	Nan::SetPrototypeMethod(tpl, "toString", ToString);

	Nan::SetAccessor(instanceTemplate, Nan::New("flags").ToLocalChecked(), GetFlags);
	Nan::SetAccessor(instanceTemplate, Nan::New("sources").ToLocalChecked(), GetSources);
	Nan::SetAccessor(instanceTemplate, Nan::New("source").ToLocalChecked(), GetSource);
	Nan::SetAccessor(instanceTemplate, Nan::New("size").ToLocalChecked(), GetSize);
	Nan::SetAccessor(instanceTemplate, Nan::New("anchor").ToLocalChecked(), GetAnchor);

	constructor.Reset(tpl);
	return scope.Escape(Nan::GetFunction(tpl).ToLocalChecked());
}
